"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  StarOff,
  Loader2,
  Mail,
  Phone,
  MapPin,
  User,
  Send,
  Inbox,
  History,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AddressBookScreenProps {
  onNavigateToSend?: (faxNumber: string, companyName: string) => void;
}

export function AddressBookScreen({ onNavigateToSend }: AddressBookScreenProps) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [addressHistory, setAddressHistory] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    fax_number: "",
    phone: "",
    email: "",
    address: "",
    contact_person: "",
    notes: "",
    tags: [] as string[],
    is_favorite: false,
  });

  // アドレス帳一覧取得
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const res = await fetch(`/api/address-book?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAddresses();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleOpenDialog = (address?: any) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        name: address.name || "",
        fax_number: address.fax_number || "",
        phone: address.phone || "",
        email: address.email || "",
        address: address.address || "",
        contact_person: address.contact_person || "",
        notes: address.notes || "",
        tags: address.tags ? JSON.parse(address.tags) : [],
        is_favorite: address.is_favorite || false,
      });
    } else {
      setEditingAddress(null);
      setFormData({
        name: "",
        fax_number: "",
        phone: "",
        email: "",
        address: "",
        contact_person: "",
        notes: "",
        tags: [],
        is_favorite: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingAddress
        ? `/api/address-book/${editingAddress.id}`
        : "/api/address-book";
      const method = editingAddress ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchAddresses();
        alert(editingAddress ? "アドレスを更新しました" : "アドレスを追加しました");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`保存に失敗しました: ${errorData.error || "不明なエラー"}`);
      }
    } catch (error) {
      console.error("Failed to save address:", error);
      alert("保存に失敗しました");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("このアドレスを削除しますか？")) return;

    try {
      const res = await fetch(`/api/address-book/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAddresses();
        alert("アドレスを削除しました");
      } else {
        alert("削除に失敗しました");
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
      alert("削除に失敗しました");
    }
  };

  const handleToggleFavorite = async (address: any) => {
    try {
      const res = await fetch(`/api/address-book/${address.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...address,
          tags: address.tags ? JSON.parse(address.tags) : [],
          is_favorite: !address.is_favorite,
        }),
      });

      if (res.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleFaxNumberClick = (address: any) => {
    if (onNavigateToSend) {
      onNavigateToSend(address.fax_number, address.name);
    }
  };

  const handleCompanyNameClick = async (address: any) => {
    setSelectedAddress(address);
    setIsHistoryDialogOpen(true);
    setLoadingHistory(true);

    try {
      const res = await fetch(`/api/address-book/${address.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setAddressHistory(data);
      } else {
        alert("履歴の取得に失敗しました");
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      alert("履歴の取得に失敗しました");
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
        <p>アドレス帳を読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">アドレス帳</h2>
          <p className="text-[14px] font-normal text-[#6b7280] mt-2 leading-[1.5]">
            よく使用する送信先を管理できます
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "アドレスを編集" : "新しいアドレスを追加"}
              </DialogTitle>
              <DialogDescription>
                送信先の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>会社名・組織名 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="例: 株式会社サンプル不動産"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>FAX番号 <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.fax_number}
                    onChange={(e) => setFormData({ ...formData, fax_number: e.target.value })}
                    required
                    placeholder="例: 03-1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>電話番号</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="例: 03-1234-5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="例: contact@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>住所</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="例: 東京都渋谷区..."
                />
              </div>

              <div className="space-y-2">
                <Label>担当者名</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="例: 山田 太郎"
                />
              </div>

              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="メモや注意事項を入力"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_favorite"
                  checked={formData.is_favorite}
                  onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_favorite" className="cursor-pointer">
                  お気に入りに追加
                </Label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  保存
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="会社名、FAX番号、電話番号で検索..."
          className="pl-10"
        />
      </div>

      {/* アドレス一覧（テーブル形式） */}
      {addresses.length === 0 ? (
        <Card className="bg-white border-[#e5e7eb]">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500">アドレスが登録されていません</p>
            <p className="text-sm text-slate-400 mt-2">「新規追加」ボタンからアドレスを追加してください</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-[#e5e7eb]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Star className="w-4 h-4" />
                  </TableHead>
                  <TableHead className="min-w-[200px]">会社名</TableHead>
                  <TableHead className="min-w-[150px]">FAX番号</TableHead>
                  <TableHead className="min-w-[120px]">電話番号</TableHead>
                  <TableHead className="min-w-[200px]">担当者</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((address) => (
                  <TableRow key={address.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFavorite(address)}
                        className="h-8 w-8"
                      >
                        {address.is_favorite ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleCompanyNameClick(address)}
                        className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {address.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleFaxNumberClick(address)}
                        className="text-left text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        {address.fax_number}
                      </button>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {address.phone || "-"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {address.contact_person || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(address)}
                          className="h-8 w-8"
                          title="編集"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(address.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 連絡先情報・履歴ダイアログ */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>連絡先情報・やり取り履歴</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsHistoryDialogOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              {selectedAddress?.name} の連絡先情報とやり取り履歴
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-500">履歴を読み込んでいます...</p>
            </div>
          ) : addressHistory ? (
            <div className="space-y-6">
              {/* 連絡先情報 */}
              <Card className="bg-white border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">連絡先情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-500">会社名</Label>
                      <p className="text-sm font-medium text-slate-900">{addressHistory.address.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">FAX番号</Label>
                      <p className="text-sm font-medium text-slate-900">{addressHistory.address.fax_number}</p>
                    </div>
                    {addressHistory.address.phone && (
                      <div>
                        <Label className="text-xs text-slate-500">電話番号</Label>
                        <p className="text-sm font-medium text-slate-900">{addressHistory.address.phone}</p>
                      </div>
                    )}
                    {addressHistory.address.email && (
                      <div>
                        <Label className="text-xs text-slate-500">メールアドレス</Label>
                        <p className="text-sm font-medium text-slate-900">{addressHistory.address.email}</p>
                      </div>
                    )}
                    {addressHistory.address.address && (
                      <div className="col-span-2">
                        <Label className="text-xs text-slate-500">住所</Label>
                        <p className="text-sm font-medium text-slate-900">{addressHistory.address.address}</p>
                      </div>
                    )}
                    {addressHistory.address.contact_person && (
                      <div>
                        <Label className="text-xs text-slate-500">担当者</Label>
                        <p className="text-sm font-medium text-slate-900">{addressHistory.address.contact_person}</p>
                      </div>
                    )}
                    {addressHistory.address.notes && (
                      <div className="col-span-2">
                        <Label className="text-xs text-slate-500">備考</Label>
                        <p className="text-sm font-medium text-slate-900">{addressHistory.address.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 送信履歴 */}
              <Card className="bg-white border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    送信履歴 ({addressHistory.sentFaxes.length}件)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {addressHistory.sentFaxes.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">送信履歴がありません</p>
                  ) : (
                    <div className="space-y-3">
                      {addressHistory.sentFaxes.slice(0, 10).map((fax: any) => (
                        <div key={fax.id} className="border-b border-slate-200 pb-3 last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {new Date(fax.sent_at).toLocaleString("ja-JP")}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                物件: {fax.property?.name || "-"} / 担当者: {fax.user?.name || "-"}
                              </p>
                              {fax.notes && (
                                <p className="text-xs text-slate-600 mt-1">{fax.notes}</p>
                              )}
                            </div>
                            <Badge variant={fax.status === "success" ? "default" : "destructive"}>
                              {fax.status === "success" ? "送信済み" : fax.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 受信履歴 */}
              <Card className="bg-white border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-green-600" />
                    受信履歴 ({addressHistory.receivedFaxes.length}件)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {addressHistory.receivedFaxes.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">受信履歴がありません</p>
                  ) : (
                    <div className="space-y-3">
                      {addressHistory.receivedFaxes.slice(0, 10).map((fax: any) => (
                        <div key={fax.id} className="border-b border-slate-200 pb-3 last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {new Date(fax.received_at).toLocaleString("ja-JP")}
                              </p>
                              {fax.from_company_name && (
                                <p className="text-xs text-slate-500 mt-1">
                                  送信元: {fax.from_company_name}
                                </p>
                              )}
                              {fax.document_type && (
                                <p className="text-xs text-slate-600 mt-1">
                                  種別: {fax.document_type}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">
                              {fax.is_read ? "既読" : "未読"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

