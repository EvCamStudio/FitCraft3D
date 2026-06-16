import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  Move,
  Undo2,
  Redo2,
  Upload,
  Type,
  Shapes,
  Layout as LayoutIcon,
  Eye,
  Lock,
  X,
  Plus,
  Palette,
  Grid3X3,
  Image,
  HelpCircle,
  Shirt,
  Check,
  Box,
} from "lucide-react";

const productTypes = [
  { id: "t-shirt", name: "T-Shirt", image: "/hero-tshirt.png" },
  { id: "hoodie", name: "Hoodie", image: "/products/product-1.png" },
  { id: "sweater", name: "Sweater", image: "/products/product-3.png" },
  { id: "jacket", name: "Jacket", image: "/products/product-7.png" },
  { id: "tank-top", name: "Tank Top", image: "/products/product-4.png" },
];

const colorPresets = [
  "#FFFFFF", "#F9FAFB", "#1F2937", "#374151", "#6B7280",
  "#DC2626", "#2563EB", "#6D4AFF", "#10B981", "#F59E0B",
  "#EC4899", "#8B5CF6", "#14B8A6", "#F97316",
];

interface DesignElement {
  id: string;
  type: "text" | "image";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  fontSize?: number;
  visible: boolean;
  locked: boolean;
}

export default function Studio() {
  const [selectedProduct, _setSelectedProduct] = useState(productTypes[0]);
  const [productColor, setProductColor] = useState("#FFFFFF");
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [zoom, _setZoom] = useState(100);
  const [elements, setElements] = useState<DesignElement[]>([
    {
      id: "1",
      type: "text",
      content: "CREATE\nYOUR STYLE",
      x: 50,
      y: 40,
      width: 200,
      height: 80,
      rotation: 0,
      color: "#6D4AFF",
      fontSize: 28,
      visible: true,
      locked: false,
    },
    {
      id: "2",
      type: "text",
      content: "YOUR",
      x: 120,
      y: 55,
      width: 100,
      height: 40,
      rotation: -5,
      color: "#1F2937",
      fontSize: 20,
      visible: true,
      locked: false,
    },
    {
      id: "3",
      type: "image",
      content: "Splash Graphic",
      x: 80,
      y: 30,
      width: 140,
      height: 100,
      rotation: 0,
      visible: true,
      locked: false,
    },
  ]);
  const [selectedElement, setSelectedElement] = useState<string | null>("1");
  const [textInput, setTextInput] = useState("CREATE YOUR STYLE");
  const [activeTab, setActiveTab] = useState("desain");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const selectedEl = elements.find((e) => e.id === selectedElement);

  const handleAddText = () => {
    const newEl: DesignElement = {
      id: Date.now().toString(),
      type: "text",
      content: "New Text",
      x: 100,
      y: 50,
      width: 120,
      height: 40,
      rotation: 0,
      color: "#6D4AFF",
      fontSize: 18,
      visible: true,
      locked: false,
    };
    setElements([...elements, newEl]);
    setSelectedElement(newEl.id);
    setTextInput("New Text");
    setActiveTab("teks");
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newEl: DesignElement = {
          id: Date.now().toString(),
          type: "image",
          content: ev.target?.result as string,
          x: 80,
          y: 40,
          width: 120,
          height: 100,
          rotation: 0,
          visible: true,
          locked: false,
        };
        setElements([...elements, newEl]);
        setSelectedElement(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const toggleVisibility = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (el) updateElement(id, { visible: !el.visible });
  };

  const toggleLock = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (el) updateElement(id, { locked: !el.locked });
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter((e) => e.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      const el = elements.find((x) => x.id === id);
      if (!el || el.locked) return;
      setSelectedElement(id);
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        dragOffset.current = {
          x: e.clientX - rect.left - (el.x / 100) * rect.width,
          y: e.clientY - rect.top - (el.y / 100) * rect.height,
        };
      }
    },
    [elements]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedElement || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100;
      updateElement(selectedElement, {
        x: Math.max(0, Math.min(90, x)),
        y: Math.max(0, Math.min(85, y)),
      });
    },
    [isDragging, selectedElement]
  );

  const handleMouseUp = () => setIsDragging(false);

  const handleTextChange = (val: string) => {
    setTextInput(val);
    if (selectedElement) {
      updateElement(selectedElement, { content: val });
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="h-[calc(100vh-64px)] flex flex-col bg-[#F9FAFB]">
        {/* Top Bar */}
        <div className="h-[52px] bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-1">
            {[
              { icon: RotateCcw, label: "Rotate" },
              { icon: ZoomIn, label: "Zoom" },
              { icon: Move, label: "Pan" },
            ].map((tool) => (
              <button
                key={tool.label}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#6D4AFF] hover:bg-[#F5F3FF] transition-colors"
                title={tool.label}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#6D4AFF] hover:bg-[#F5F3FF] transition-colors">
              <Undo2 className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#6D4AFF] hover:bg-[#F5F3FF] transition-colors">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "3d"
                  ? "bg-[#6D4AFF] text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              3D View
            </button>
            <button
              onClick={() => setViewMode("2d")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "2d"
                  ? "bg-[#6D4AFF] text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              2D Flat View
            </button>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div className="w-[260px] bg-white border-r border-gray-100 overflow-y-auto shrink-0 hidden lg:block">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3 flex items-center justify-between">
                Pilih Produk
                <button className="text-[10px] text-[#6D4AFF]">Ubah Produk</button>
              </h3>

              {/* Selected Product */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F9FAFB] mb-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {selectedProduct.name}
                  </p>
                  <p className="text-[10px] text-gray-500">PBR v4 - 100% Cotton</p>
                </div>
              </div>

              {/* Color Swatches */}
              <h4 className="text-[11px] font-semibold text-gray-700 mb-2">
                Pilih Warna Baju
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {colorPresets.slice(0, 10).map((c) => (
                  <button
                    key={c}
                    onClick={() => setProductColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                      productColor === c
                        ? "border-[#6D4AFF] scale-110"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Add Design Actions */}
              <h4 className="text-[11px] font-semibold text-gray-700 mb-2">
                Tambahkan Desain
              </h4>
              <div className="space-y-2 mb-4">
                {[
                  { icon: Upload, label: "Upload Gambar", desc: "Upload atau pilih dari gallery", action: handleUploadClick },
                  { icon: Type, label: "Tambah Teks", desc: "Ketik teks dengan font pilihanmu", action: handleAddText },
                  { icon: Shapes, label: "Elemen Grafis", desc: "Pilih ikon, shape, dan ilustrasi", action: () => {} },
                  { icon: LayoutIcon, label: "Template", desc: "Pilih dari ribuan template keren", action: () => {} },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#F5F3FF] flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-[#6D4AFF]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-gray-500">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* View thumbnails */}
              <h4 className="text-[11px] font-semibold text-gray-700 mb-2">
                View
              </h4>
              <div className="flex gap-2">
                {["Depan", "Belakang", "Kanan", "Kiri"].map((view) => (
                  <button
                    key={view}
                    className="flex-1 text-[10px] py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-[#6D4AFF] hover:text-[#6D4AFF] transition-colors"
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Center Canvas */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gradient-radial from-[#F5F3FF] to-white">
            <div
              ref={canvasRef}
              className="relative w-[400px] h-[500px]"
              style={{ transform: `scale(${zoom / 100})` }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Product Base */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={selectedProduct.image}
                  alt="Product"
                  className="w-[90%] h-[90%] object-contain transition-all duration-300"
                  style={{
                    filter: productColor !== "#FFFFFF" && productColor !== "#F9FAFB"
                      ? `drop-shadow(0 0 30px ${productColor}40)`
                      : undefined,
                  }}
                />
              </div>

              {/* Design Elements Overlay */}
              {elements
                .filter((el) => el.visible)
                .map((el) => (
                  <div
                    key={el.id}
                    className={`absolute cursor-move select-none ${
                      selectedElement === el.id
                        ? "ring-2 ring-[#6D4AFF] ring-offset-2"
                        : ""
                    } ${el.locked ? "cursor-not-allowed opacity-70" : ""}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: el.width,
                      height: el.height,
                      transform: `rotate(${el.rotation}deg)`,
                      zIndex: selectedElement === el.id ? 10 : 1,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={() => setSelectedElement(el.id)}
                  >
                    {el.type === "text" ? (
                      <div
                        className="w-full h-full flex items-center justify-center text-center font-extrabold leading-tight whitespace-pre-line"
                        style={{
                          color: el.color,
                          fontSize: `${el.fontSize}px`,
                          textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                        }}
                      >
                        {el.content}
                      </div>
                    ) : (
                      <img
                        src={el.content}
                        alt="design element"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    )}
                  </div>
                ))}
            </div>

            {/* Bottom Toolbar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-xl shadow-dropdown p-1.5 border border-gray-100">
              {[
                { icon: Shirt, label: "Model" },
                { icon: Palette, label: "Warna" },
                { icon: Grid3X3, label: "Pattern" },
                { icon: Image, label: "Background" },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg hover:bg-[#F9FAFB] text-gray-500 hover:text-[#6D4AFF] transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[300px] bg-white border-l border-gray-100 overflow-y-auto shrink-0 hidden lg:block">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full rounded-none border-b bg-transparent p-0 h-auto">
                {["desain", "teks", "layer"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#6D4AFF] data-[state=active]:text-[#6D4AFF] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs font-medium capitalize"
                  >
                    {tab === "layer" ? `Layer (${elements.length})` : tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="desain" className="p-4 m-0">
                <Button
                  onClick={handleUploadClick}
                  className="w-full bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white mb-3"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Gambar
                </Button>
                <p className="text-center text-xs text-gray-400 mb-3">atau</p>
                <Button variant="outline" className="w-full mb-4">
                  Pilih dari Gallery
                </Button>

                <h4 className="text-xs font-semibold text-gray-700 mb-2">
                  Desain Saya
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {elements
                    .filter((el) => el.type === "image")
                    .map((el) => (
                      <div
                        key={el.id}
                        className="aspect-square rounded-lg bg-[#F9FAFB] flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#6D4AFF]"
                        onClick={() => setSelectedElement(el.id)}
                      >
                        <img
                          src={el.content}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  <button
                    onClick={handleUploadClick}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#6D4AFF] hover:text-[#6D4AFF] transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="teks" className="p-4 m-0 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Teks
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm resize-none focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/10 outline-none transition-all"
                    placeholder="Ketik teks..."
                  />
                </div>

                {selectedEl && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Ukuran Font
                      </label>
                      <Slider
                        value={[selectedEl.fontSize || 18]}
                        onValueChange={([v]) =>
                          updateElement(selectedEl.id, { fontSize: v })
                        }
                        min={8}
                        max={72}
                        step={1}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Warna
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {colorPresets.map((c) => (
                          <button
                            key={c}
                            onClick={() =>
                              updateElement(selectedEl.id, { color: c })
                            }
                            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                              selectedEl.color === c
                                ? "border-[#6D4AFF] scale-110"
                                : "border-gray-200"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Rotasi
                      </label>
                      <Slider
                        value={[selectedEl.rotation]}
                        onValueChange={([v]) =>
                          updateElement(selectedEl.id, { rotation: v })
                        }
                        min={-180}
                        max={180}
                        step={1}
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="layer" className="m-0">
                <div className="p-2 space-y-1">
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        selectedElement === el.id
                          ? "bg-[#F5F3FF] border-l-2 border-l-[#6D4AFF]"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedElement(el.id)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(el.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {el.type === "text" ? (
                          <Type className="w-3.5 h-3.5 text-[#6D4AFF]" />
                        ) : (
                          <Image className="w-3.5 h-3.5 text-[#6D4AFF]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {el.type === "text"
                            ? el.content.slice(0, 15)
                            : "Graphic Element"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {el.type === "text" ? "Text" : "Image"}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(el.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(el.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Position & Size */}
                {selectedEl && (
                  <div className="p-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-700 mb-3">
                      Atur Posisi & Ukuran
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { label: "X", value: selectedEl.x, key: "x" as const },
                        { label: "Y", value: selectedEl.y, key: "y" as const },
                        { label: "W", value: selectedEl.width, key: "width" as const },
                        { label: "H", value: selectedEl.height, key: "height" as const },
                      ].map((field) => (
                        <div
                          key={field.label}
                          className="flex items-center gap-2 bg-[#F9FAFB] rounded-lg px-2 py-1.5"
                        >
                          <span className="text-[10px] font-medium text-gray-500 w-4">
                            {field.label}
                          </span>
                          <input
                            type="number"
                            value={Math.round(field.value)}
                            onChange={(e) =>
                              updateElement(selectedEl.id, {
                                [field.key]: Number(e.target.value),
                              })
                            }
                            className="w-full bg-transparent text-xs text-gray-900 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 bg-[#F9FAFB] rounded-lg px-2 py-1.5">
                      <RotateCw className="w-3 h-3 text-gray-500" />
                      <input
                        type="number"
                        value={selectedEl.rotation}
                        onChange={(e) =>
                          updateElement(selectedEl.id, {
                            rotation: Number(e.target.value),
                          })
                        }
                        className="w-full bg-transparent text-xs text-gray-900 outline-none"
                      />
                      <span className="text-[10px] text-gray-500">\u00B0</span>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="h-[56px] bg-white border-t border-gray-100 flex items-center justify-between px-4 shrink-0">
          <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700">
            <HelpCircle className="w-4 h-4" />
            Bantuan
          </button>

          <div className="flex items-center gap-6">
            {[
              { icon: Box, title: "3D Real-time Preview", desc: "Lihat desainmu dari semua sisi" },
              { icon: Check, title: "Bahan Berkualitas", desc: "Comfort & Premium Quality" },
              { icon: Palette, title: "Cetak Presisi Tinggi", desc: "Warna tajam, detail sempurna" },
              { icon: Lock, title: "Garansi Kepuasan", desc: "100% uang kembali" },
            ].map((item) => (
              <div key={item.title} className="hidden md:flex items-center gap-2">
                <item.icon className="w-4 h-4 text-[#6D4AFF]" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-700">
                    {item.title}
                  </p>
                  <p className="text-[9px] text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
