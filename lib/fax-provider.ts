// FAXプロバイダー統合ライブラリ
// 実際のFAXプロバイダーAPIを呼び出すための抽象化レイヤー

export interface FaxProvider {
  sendFax(params: {
    to: string;
    pdfBuffer: Buffer;
    from?: string;
  }): Promise<{
    success: boolean;
    faxId?: string;
    error?: string;
  }>;
}

// InterFAX実装（TODO: 実際のAPI統合）
export class InterFAXProvider implements FaxProvider {
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.INTERFAX_USERNAME || "";
    this.password = process.env.INTERFAX_PASSWORD || "";
  }

  async sendFax(params: { to: string; pdfBuffer: Buffer; from?: string }): Promise<{
    success: boolean;
    faxId?: string;
    error?: string;
  }> {
    // TODO: InterFAX APIを実装
    // 参考: https://www.interfax.net/en/dev/rest/reference/2939
    /*
    const formData = new FormData();
    formData.append("faxnumber", params.to);
    formData.append("file", new Blob([params.pdfBuffer]), "fax.pdf");

    const response = await fetch("https://rest.interfax.net/outbound/faxes", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`
      },
      body: formData
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    const data = await response.json();
    return { success: true, faxId: data.faxId };
    */

    // モック実装
    console.log(`[InterFAX] Sending FAX to ${params.to}`);
    return { success: true, faxId: `mock-${Date.now()}` };
  }
}

// Twilio実装（TODO: 実際のAPI統合）
export class TwilioProvider implements FaxProvider {
  private accountSid: string;
  private authToken: string;
  private faxNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.faxNumber = process.env.TWILIO_FAX_NUMBER || "";
  }

  async sendFax(params: { to: string; pdfBuffer: Buffer; from?: string }): Promise<{
    success: boolean;
    faxId?: string;
    error?: string;
  }> {
    // TODO: Twilio APIを実装
    // 参考: https://www.twilio.com/docs/fax/api/fax-resource
    /*
    const formData = new FormData();
    formData.append("To", params.to);
    formData.append("From", params.from || this.faxNumber);
    formData.append("MediaUrl", await uploadToS3(params.pdfBuffer));

    const response = await fetch(
      `https://fax.twilio.com/v1/Faxes`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`
        },
        body: formData
      }
    );

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    const data = await response.json();
    return { success: true, faxId: data.sid };
    */

    // モック実装
    console.log(`[Twilio] Sending FAX to ${params.to}`);
    return { success: true, faxId: `mock-${Date.now()}` };
  }
}

// プロバイダーファクトリー
export function createFaxProvider(): FaxProvider {
  const provider = process.env.FAX_PROVIDER || "mock";

  switch (provider) {
    case "interfax":
      return new InterFAXProvider();
    case "twilio":
      return new TwilioProvider();
    default:
      // モックプロバイダー
      return {
        async sendFax() {
          console.log("[Mock] FAX sending simulated");
          return { success: true, faxId: `mock-${Date.now()}` };
        },
      };
  }
}





// 実際のFAXプロバイダーAPIを呼び出すための抽象化レイヤー

export interface FaxProvider {
  sendFax(params: {
    to: string;
    pdfBuffer: Buffer;
    from?: string;
  }): Promise<{
    success: boolean;
    faxId?: string;
    error?: string;
  }>;
}

// InterFAX実装（TODO: 実際のAPI統合）
export class InterFAXProvider implements FaxProvider {
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.INTERFAX_USERNAME || "";
    this.password = process.env.INTERFAX_PASSWORD || "";
  }

  async sendFax(params: { to: string; pdfBuffer: Buffer; from?: string }): Promise<{
    success: boolean;
    faxId?: string;
    error?: string;
  }> {
    // TODO: InterFAX APIを実装
    // 参考: https://www.interfax.net/en/dev/rest/reference/2939
    /*
    const formData = new FormData();
    formData.append("faxnumber", params.to);
    formData.append("file", new Blob([params.pdfBuffer]), "fax.pdf");

    const response = await fetch("https://rest.interfax.net/outbound/faxes", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`
      },
      body: formData
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    const data = await response.json();
    return { success: true, faxId: data.faxId };
    */

    // モック実装
    console.log(`[InterFAX] Sending FAX to ${params.to}`);
    return { success: true, faxId: `mock-${Date.now()}` };
  }
}

// Twilio実装（TODO: 実際のAPI統合）
export class TwilioProvider implements FaxProvider {
  private accountSid: string;
  private authToken: string;
  private faxNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.faxNumber = process.env.TWILIO_FAX_NUMBER || "";
  }

  async sendFax(params: { to: string; pdfBuffer: Buffer; from?: string }): Promise<{
    success: boolean;
    faxId?: string;
    error?: string;
  }> {
    // TODO: Twilio APIを実装
    // 参考: https://www.twilio.com/docs/fax/api/fax-resource
    /*
    const formData = new FormData();
    formData.append("To", params.to);
    formData.append("From", params.from || this.faxNumber);
    formData.append("MediaUrl", await uploadToS3(params.pdfBuffer));

    const response = await fetch(
      `https://fax.twilio.com/v1/Faxes`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`
        },
        body: formData
      }
    );

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    const data = await response.json();
    return { success: true, faxId: data.sid };
    */

    // モック実装
    console.log(`[Twilio] Sending FAX to ${params.to}`);
    return { success: true, faxId: `mock-${Date.now()}` };
  }
}

// プロバイダーファクトリー
export function createFaxProvider(): FaxProvider {
  const provider = process.env.FAX_PROVIDER || "mock";

  switch (provider) {
    case "interfax":
      return new InterFAXProvider();
    case "twilio":
      return new TwilioProvider();
    default:
      // モックプロバイダー
      return {
        async sendFax() {
          console.log("[Mock] FAX sending simulated");
          return { success: true, faxId: `mock-${Date.now()}` };
        },
      };
  }
}








