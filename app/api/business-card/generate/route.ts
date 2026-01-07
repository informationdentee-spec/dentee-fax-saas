import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

// 名刺テンプレートから画像を生成するAPI
export async function POST(req: Request) {
  try {
    const { template, variables } = await req.json();

    if (!template) {
      return NextResponse.json({ error: "Template is required" }, { status: 400 });
    }

    // 変数を置換
    let html = template;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        html = html.replace(regex, String(value || ""));
      });
      // Handlebars風の条件分岐を処理（簡易版）
      html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
        return variables[varName] ? content : "";
      });
    }

    // PuppeteerでHTMLを画像に変換
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 600, height: 350 });

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 600, height: 350 }
    });

    await browser.close();

    // Base64エンコード
    const base64Image = `data:image/png;base64,${screenshot.toString('base64')}`;

    return NextResponse.json({ image: base64Image, html });
  } catch (error) {
    console.error("Failed to generate business card:", error);
    return NextResponse.json({ error: "Failed to generate business card" }, { status: 500 });
  }
}

// 名刺テンプレートを画像（Base64）に変換するAPI
export async function PUT(req: Request) {
  try {
    const { html } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "HTML is required" }, { status: 400 });
    }

    // PuppeteerでHTMLを画像に変換
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 600, height: 350 });

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 600, height: 350 }
    });

    await browser.close();

    // Base64エンコード
    const base64Image = `data:image/png;base64,${screenshot.toString('base64')}`;

    return NextResponse.json({ image: base64Image });
  } catch (error) {
    console.error("Failed to convert business card to image:", error);
    return NextResponse.json({ error: "Failed to convert business card to image" }, { status: 500 });
  }
}

