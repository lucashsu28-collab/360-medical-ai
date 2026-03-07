// ════════════════════════════════
// data/treatments.ts
// ════════════════════════════════
export interface Treatment {
  id: string;
  name: string;
  category: "laser" | "injection" | "surgery" | "skin";
  categoryLabel: string;
  description: string;
  priceMin: number;
  priceMax: number;
  clinicCount: number;
  isPopular: boolean;
  imagePlaceholder: string;
}

export const treatments: Treatment[] = [
  { id:"t01", name:"皮秒雷射", category:"laser", categoryLabel:"雷射光療", description:"針對斑點、毛孔粗大、膚色不均，術後修復期短，效果自然。", priceMin:6000, priceMax:15000, clinicCount:127, isPopular:true, imagePlaceholder:"✨" },
  { id:"t02", name:"飛梭雷射", category:"laser", categoryLabel:"雷射光療", description:"改善凹疤、毛孔、細紋，刺激膠原蛋白再生，適合整體膚質提升。", priceMin:5000, priceMax:12000, clinicCount:98, isPopular:true, imagePlaceholder:"🌟" },
  { id:"t03", name:"淨膚雷射", category:"laser", categoryLabel:"雷射光療", description:"快速淡化曬斑、雀斑，改善膚色暗沉，療程時間短，適合初次嘗試。", priceMin:2000, priceMax:6000, clinicCount:203, isPopular:false, imagePlaceholder:"💫" },
  { id:"t04", name:"電波拉皮（Thermage）", category:"laser", categoryLabel:"雷射光療", description:"非侵入性緊緻提拉，刺激深層膠原，效果可維持 1–2 年。", priceMin:30000, priceMax:80000, clinicCount:84, isPopular:false, imagePlaceholder:"🔆" },
  { id:"t05", name:"超音波拉皮（Ulthera）", category:"laser", categoryLabel:"雷射光療", description:"深達 SMAS 筋膜層，緊緻下臉、提拉輪廓，適合輕熟齡。", priceMin:25000, priceMax:60000, clinicCount:76, isPopular:false, imagePlaceholder:"⚡" },
  { id:"t06", name:"玻尿酸填充", category:"injection", categoryLabel:"微整形注射", description:"填補凹陷、豐唇、拉提輪廓，立即見效，效果自然，可吸收代謝。", priceMin:8000, priceMax:30000, clinicCount:312, isPopular:true, imagePlaceholder:"💉" },
  { id:"t07", name:"肉毒桿菌注射", category:"injection", categoryLabel:"微整形注射", description:"放鬆肌肉改善動態紋，包含抬頭紋、魚尾紋、咬肌縮小。", priceMin:5000, priceMax:20000, clinicCount:287, isPopular:true, imagePlaceholder:"🔮" },
  { id:"t08", name:"晶亮瓷（Radiesse）", category:"injection", categoryLabel:"微整形注射", description:"骨架填充感更強，適合隆鼻、下巴塑形，效果持久約 1.5 年。", priceMin:15000, priceMax:40000, clinicCount:134, isPopular:false, imagePlaceholder:"💎" },
  { id:"t09", name:"童顏針（Sculptra）", category:"injection", categoryLabel:"微整形注射", description:"刺激自體膠原增生，改善全臉鬆弛凹陷，效果漸進持久約 2 年。", priceMin:20000, priceMax:60000, clinicCount:89, isPopular:false, imagePlaceholder:"🌸" },
  { id:"t10", name:"埋線拉提", category:"injection", categoryLabel:"微整形注射", description:"可吸收蛋白線埋入皮下，即時提拉同時刺激膠原，恢復期短。", priceMin:15000, priceMax:50000, clinicCount:112, isPopular:false, imagePlaceholder:"🪡" },
  { id:"t11", name:"雙眼皮手術", category:"surgery", categoryLabel:"外科手術", description:"割雙眼皮（切開法）或縫雙眼皮（縫合法），改善單眼皮或不對稱。", priceMin:20000, priceMax:60000, clinicCount:178, isPopular:true, imagePlaceholder:"👁️" },
  { id:"t12", name:"隆鼻手術", category:"surgery", categoryLabel:"外科手術", description:"放置矽膠或卡麥拉假體，搭配自體軟骨雕塑，改善鼻型與高度。", priceMin:50000, priceMax:150000, clinicCount:134, isPopular:true, imagePlaceholder:"👃" },
  { id:"t13", name:"抽脂手術", category:"surgery", categoryLabel:"外科手術", description:"針對腹部、大腿、手臂等局部脂肪堆積，快速雕塑體態。", priceMin:40000, priceMax:200000, clinicCount:98, isPopular:false, imagePlaceholder:"🏃" },
  { id:"t14", name:"眼袋手術", category:"surgery", categoryLabel:"外科手術", description:"移除或重新分布眼袋脂肪，改善黑眼圈與疲憊感，年輕化效果顯著。", priceMin:30000, priceMax:80000, clinicCount:112, isPopular:false, imagePlaceholder:"😌" },
  { id:"t15", name:"全臉拉皮手術", category:"surgery", categoryLabel:"外科手術", description:"針對嚴重鬆弛的 SMAS 筋膜提拉，提供最持久的抗老效果。", priceMin:100000, priceMax:300000, clinicCount:56, isPopular:false, imagePlaceholder:"✂️" },
  { id:"t16", name:"痘疤治療", category:"skin", categoryLabel:"皮膚管理", description:"結合飛梭雷射、皮秒及微針，改善冰鑿型、車廂型各類痘疤。", priceMin:5000, priceMax:20000, clinicCount:189, isPopular:true, imagePlaceholder:"🌿" },
  { id:"t17", name:"醫美保濕療程", category:"skin", categoryLabel:"皮膚管理", description:"深層補水、修護屏障，適合敏感肌、換季乾燥及術後修復。", priceMin:2000, priceMax:8000, clinicCount:234, isPopular:false, imagePlaceholder:"💧" },
  { id:"t18", name:"酒糟玫瑰斑治療", category:"skin", categoryLabel:"皮膚管理", description:"結合染料雷射與消炎療程，改善臉部潮紅、微血管擴張。", priceMin:6000, priceMax:15000, clinicCount:78, isPopular:false, imagePlaceholder:"🌹" },
  { id:"t19", name:"除毛雷射", category:"skin", categoryLabel:"皮膚管理", description:"永久性毛髮減少，多種雷射波長可選，適用各膚色與部位。", priceMin:1500, priceMax:8000, clinicCount:312, isPopular:false, imagePlaceholder:"🪒" },
  { id:"t20", name:"微針導入療程", category:"skin", categoryLabel:"皮膚管理", description:"微針刺激膠原增生，搭配生長因子或玻尿酸導入，改善膚質與細紋。", priceMin:3000, priceMax:10000, clinicCount:156, isPopular:false, imagePlaceholder:"💊" },
];
