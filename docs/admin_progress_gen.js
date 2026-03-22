const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
        VerticalAlign, LevelFormat } = require('docx');
const fs = require('fs');

const TEAL = "0F6E56"; const TEAL_LIGHT = "E1F5EE";
const RED = "A32D2D"; const RED_LIGHT = "FCEBEB";
const GRAY = "5F5E5A"; const GRAY_LIGHT = "F1EFE8";
const PURPLE = "534AB7"; const PURPLE_LIGHT = "EEEDFE";
const AMBER = "854F0B"; const AMBER_LIGHT = "FAEEDA";
const WHITE = "FFFFFF"; const BORDER_COLOR = "DDDDDD";
const NAVY = "1D3461"; const DARK_NAVY = "0F2744";

const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, opts = {}) {
  const { fill=WHITE, bold=false, color='333333', width=1800, align=AlignmentType.LEFT, size=18 } = opts;
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold, color, size, font: "Arial" })] })]
  });
}

function statusCell(text, type, width=1500) {
  const map = {
    done:  { fill: TEAL_LIGHT,   color: TEAL,   label: "✓ 完成" },
    doing: { fill: RED_LIGHT,    color: RED,    label: "進行中" },
    todo:  { fill: GRAY_LIGHT,   color: GRAY,   label: "待做" },
    aims:  { fill: PURPLE_LIGHT, color: PURPLE, label: text||"AIMS串接" },
    ext:   { fill: AMBER_LIGHT,  color: AMBER,  label: text||"串接" },
  };
  const s = map[type]||map.todo;
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: s.fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: s.label, bold: true, color: s.color, size: 16, font: "Arial" })] })]
  });
}

function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: WHITE, size: 17, font: "Arial" })] })]
  });
}

function spacer() { return new Paragraph({ spacing: { after: 160 }, children: [new TextRun("")] }); }

// ============================================================
// 13模組資料 — 每次更新進度只需修改這裡的 p1/p2/p3 欄位
// done=完成 doing=進行中 todo=待做 aims=AIMS串接 ext=外部串接
// ============================================================
const modules = [
  { num:"#1",  name:"LINE OA AI醫美顧問系統", route:"/admin/line-ai",          p1:"done",  p2:"todo", p3:"todo",
    items:["查看AI顧問對話記錄（依用戶/時間篩選）","設定歡迎訊息、圖文選單","管理常見問題知識庫（新增/編輯/刪除）","調整Gemini回答參數（溫度、字數限制）","查看LINE用戶清單（加入時間、對話次數）","手動推播訊息給所有用戶"] },
  { num:"#2",  name:"資料爬取系統管理",        route:"/admin/scheduler",        p1:"done",  p2:"todo", p3:"todo",
    items:["各爬蟲最後執行時間、成功/失敗筆數","手動觸發指定爬蟲（Google評分/司法院/健保署/行政處分）","排程設定查看（下次執行時間）","爬蟲執行log查看","資料完整度儀表板（每個維度幾家有資料）"] },
  { num:"#3",  name:"醫美平台數據看板",        route:"/admin",                  p1:"done",  p2:"todo", p3:"todo",
    items:["今日/本週/本月頁面瀏覽數、獨立訪客","LINE加入人數趨勢圖","報告解鎖次數趨勢圖","診所頁面查詢TOP 20排行","各維度資料完整度統計"] },
  { num:"#4",  name:"客戶列表（AIMS串接）",    route:"/admin/clients",          p1:"todo",  p2:"todo", p3:"aims",
    items:["顯示industry=medical_aesthetic的診所客戶","欄位：診所名稱、方案、付費狀態、加入日期","搜尋/篩選功能","快速跳轉到AIMS對應客戶頁面","新客戶從醫美平台匯入AIMS"] },
  { num:"#5",  name:"診所資料管理",            route:"/admin/clinics",          p1:"done",  p2:"todo", p3:"todo",
    items:["904家診所列表（搜尋/篩選/排序）","編輯診所資料（名稱、地址、電話、療程標籤）","手動調整評分（附調整原因記錄）","查看各維度分數明細","與AIMS品牌資料雙向同步","標記診所為合作/非合作"] },
  { num:"#6",  name:"合作診所開通/停用",       route:"/admin/clinics/partners", p1:"doing", p2:"todo", p3:"todo",
    items:["合作診所列表（狀態：開通/停用/審核中）","一鍵開通/停用（連動AIMS方案狀態）","設定前台曝光內容（介紹文字、圖片）","管理精選療程（新增/編輯/刪除）","管理優惠方案（效期/內容/限制）","合作診所前台預覽"] },
  { num:"#7",  name:"資料匯出",               route:"/admin/export",           p1:"doing", p2:"todo", p3:"todo",
    items:["診所清單匯出CSV（可篩選欄位）","醫師清單匯出CSV","單一診所完整報告匯出PDF","批次匯出多家診所報告","匯出紀錄查看"] },
  { num:"#8",  name:"網站數據分析與排名",      route:"/admin/analytics",        p1:"doing", p2:"todo", p3:"ext",
    items:["GA4整合（頁面流量、用戶來源、跳出率）","診所頁面查詢排行榜（市場熱度指標）","熱門療程搜尋關鍵字排行","用戶地區分布地圖","裝置分布（手機/電腦）","LINE轉換漏斗（診所頁→加LINE→解鎖報告）","資料可匯出Excel供業務使用"] },
  { num:"#9",  name:"報告解鎖管理",           route:"/admin/unlocks",          p1:"done",  p2:"todo", p3:"todo",
    items:["解鎖記錄列表（LINE用戶/診所/時間）","最多人解鎖診所排行","付費/免費解鎖統計","單一用戶解鎖歷史查詢","異常解鎖偵測（同一用戶重複解鎖）"] },
  { num:"#10", name:"內容管理 CMS",           route:"/admin/cms",              p1:"doing", p2:"todo", p3:"todo",
    items:["首頁Banner管理（圖片/連結/效期）","療程分類圖片管理","精選優惠文案編輯","網站公告管理","LINE推播訊息（立即/排程推播）","SEO文案管理（接收AIMS AI SEO推送）"] },
  { num:"#11", name:"AI顧問訓練/調教",        route:"/admin/ai-training",      p1:"doing", p2:"todo", p3:"aims",
    items:["查看對話記錄（全部/指定用戶）","標記好的回答 / 壞的回答","查看壞回答統計（哪類問題答不好）","新增/編輯FAQ知識庫","測試模式（直接跟AI對話測試）","匯出對話記錄CSV"] },
  { num:"#12", name:"評分規則管理",           route:"/admin/scoring",          p1:"doing", p2:"todo", p3:"todo",
    items:["各維度權重設定（Google/司法/合法登記/行政處分）","司法案件扣分規則（1件扣幾分、上限幾分）","行政處分扣分規則","Google評分換算規則（幾星換算幾分）","新產業評分規則設定（牙醫/眼科等）","規則變更記錄（誰改的、改了什麼）"] },
  { num:"#13", name:"告警系統",               route:"/admin/alerts",           p1:"doing", p2:"todo", p3:"todo",
    items:["爬蟲失敗通知（Email/LINE推播）","資料異常警示（分數異常變動）","Cloud Run服務異常通知","API回應時間過慢警示","告警歷史記錄","告警閾值設定"] },
];

const TODAY = new Date().toISOString().slice(0,10);
const p1Done  = modules.filter(m=>m.p1==="done").length;
const p1Doing = modules.filter(m=>m.p1==="doing").length;
const p1Todo  = modules.filter(m=>m.p1==="todo").length;

function makeOverview() {
  const rows = [new TableRow({ tableHeader:true, children:[
    headerCell("#", 500), headerCell("模組名稱", 2800), headerCell("路由", 2000),
    headerCell("第一階段\nmock上線", 1200), headerCell("第二階段\n接真實資料", 1200), headerCell("第三階段\n完整串接", 1200),
  ]})];
  for (const m of modules) {
    let p3type = m.p3; let p3label = "";
    if (m.p3==="aims") p3label="AIMS串接";
    if (m.p3==="ext")  { p3type="ext"; p3label="GSC/GA4"; }
    rows.push(new TableRow({ children:[
      cell(m.num, { bold:true, color:GRAY, width:500, size:16, align:AlignmentType.CENTER }),
      new TableCell({ borders, width:{ size:2800, type:WidthType.DXA },
        shading:{ fill:WHITE, type:ShadingType.CLEAR }, margins:{ top:80, bottom:80, left:120, right:120 },
        children:[new Paragraph({ children:[new TextRun({ text:m.name, bold:true, size:17, font:"Arial" })] })] }),
      new TableCell({ borders, width:{ size:2000, type:WidthType.DXA },
        shading:{ fill:WHITE, type:ShadingType.CLEAR }, margins:{ top:80, bottom:80, left:120, right:120 },
        children:[new Paragraph({ children:[new TextRun({ text:m.route, color:"888888", size:15, font:"Courier New" })] })] }),
      statusCell("", m.p1, 1200),
      statusCell("", m.p2, 1200),
      p3type==="todo" ? statusCell("","todo",1200) : p3type==="aims" ? statusCell(p3label,"aims",1200) : statusCell(p3label,"ext",1200),
    ]}));
  }
  return new Table({ width:{ size:8900, type:WidthType.DXA }, columnWidths:[500,2800,2000,1200,1200,1200], rows });
}

function makeDetail(m) {
  const rows = [
    new TableRow({ tableHeader:true, children:[
      new TableCell({ columnSpan:3, borders,
        shading:{ fill:NAVY, type:ShadingType.CLEAR }, margins:{ top:100, bottom:100, left:160, right:120 },
        children:[new Paragraph({ children:[
          new TextRun({ text:m.num+" "+m.name, bold:true, color:WHITE, size:19, font:"Arial" }),
          new TextRun({ text:"   "+m.route, color:"AAAACC", size:15, font:"Courier New" }),
        ]})]
      })
    ]}),
    new TableRow({ children:[
      headerCell("功能項目", 5200), headerCell("第一階段", 1200), headerCell("第二階段", 1200),
    ]}),
  ];
  for (const item of m.items) {
    rows.push(new TableRow({ children:[
      cell(item, { width:5200, size:17 }),
      statusCell("","todo",1200),
      statusCell("","todo",1200),
    ]}));
  }
  return new Table({ width:{ size:7600, type:WidthType.DXA }, columnWidths:[5200,1200,1200], rows });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font:"Arial", size:20 }, paragraph: { bidirectional: false } } },
    paragraphStyles: [
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:34, bold:true, font:"Arial", color:DARK_NAVY },
        paragraph:{ spacing:{ before:280, after:180 }, outlineLevel:0 } },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:24, bold:true, font:"Arial", color:NAVY },
        paragraph:{ spacing:{ before:220, after:140 }, outlineLevel:1 } },
    ]
  },
  sections:[{
    properties:{ page:{ size:{ width:12240, height:15840 }, margin:{ top:1080, right:1080, bottom:1080, left:1080 } } },
    children:[
      new Paragraph({ heading:HeadingLevel.HEADING_1, children:[new TextRun({ text:"360醫療AI大調查 — Admin後台作業進度控管", font:"Arial", size:34, bold:true, color:DARK_NAVY })] }),
      new Paragraph({ spacing:{ after:200 }, children:[new TextRun({ text:"最後更新："+TODAY+"　　專案：360-medical-ai　　負責人：Lucas", color:"888888", size:17, font:"Arial" })] }),
      new Paragraph({ heading:HeadingLevel.HEADING_2, children:[new TextRun({ text:"當前進度摘要", font:"Arial", size:24, bold:true, color:NAVY })] }),
      new Table({ width:{ size:8900, type:WidthType.DXA }, columnWidths:[2225,2225,2225,2225],
        rows:[new TableRow({ children:[
          new TableCell({ borders, shading:{ fill:TEAL_LIGHT, type:ShadingType.CLEAR }, margins:{ top:120, bottom:120, left:160, right:160 },
            children:[ new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({ text:String(p1Done), bold:true, size:52, color:TEAL, font:"Arial" })] }), new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({ text:"第一階段完成", size:17, color:TEAL, font:"Arial" })] }) ]}),
          new TableCell({ borders, shading:{ fill:RED_LIGHT, type:ShadingType.CLEAR }, margins:{ top:120, bottom:120, left:160, right:160 },
            children:[ new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({ text:String(p1Doing), bold:true, size:52, color:RED, font:"Arial" })] }), new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({ text:"進行中", size:17, color:RED, font:"Arial" })] }) ]}),
          new TableCell({ borders, shading:{ fill:GRAY_LIGHT, type:ShadingType.CLEAR }, margins:{ top:120, bottom:120, left:160, right:160 },
            children:[ new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({ text:String(p1Todo), bold:true, size:52, color:GRAY, font:"Arial" })] }), new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({ text:"待做", size:17, color:GRAY, font:"Arial" })] }) ]}),
          new TableCell({ borders, shading:{ fill:PURPLE_LIGHT, type:ShadingType.CLEAR }, margins:{ top:120, bottom:120, left:160, right:160 },
            children:[ new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({ text:"1", bold:true, size:52, color:PURPLE, font:"Arial" })] }), new Paragraph({ alignment:AlignmentType.CENTER, children:[new TextRun({ text:"AIMS串接", size:17, color:PURPLE, font:"Arial" })] }) ]}),
        ]})]
      }),
      spacer(),
      new Paragraph({ heading:HeadingLevel.HEADING_2, children:[new TextRun({ text:"13模組三階段進度總覽", font:"Arial", size:24, bold:true, color:NAVY })] }),
      new Paragraph({ spacing:{ after:120 }, children:[new TextRun({ text:"第一階段：mock上線　第二階段：接真實DB　第三階段：AIMS/GA4完整串接", color:"888888", size:16, font:"Arial" })] }),
      makeOverview(),
      spacer(),
      new Paragraph({ heading:HeadingLevel.HEADING_2, children:[new TextRun({ text:"各模組詳細功能清單", font:"Arial", size:24, bold:true, color:NAVY })] }),
      new Paragraph({ spacing:{ after:120 }, children:[new TextRun({ text:"每個功能項目完成後於對應階段欄位更新狀態。", color:"888888", size:16, font:"Arial" })] }),
      ...modules.flatMap(m => [spacer(), makeDetail(m)]),
      spacer(),
      new Paragraph({ heading:HeadingLevel.HEADING_2, children:[new TextRun({ text:"新聊天室交接必看", font:"Arial", size:24, bold:true, color:NAVY })] }),
      ...[
        "1. 本文件為唯一進度控管來源，每次完成後更新。",
        "2. 專案路徑：c:\\Users\\User\\Dropbox\\360醫美大系統\\360-medical-ai",
        "3. 前端：https://360-medical-ai.vercel.app",
        "4. GCP：https://medical-backend-492121133498.asia-east1.run.app",
        "5. 協作：Claude給「貼給C」→ Lucas貼Cursor → 回報「已貼」→ 更新進度。",
        "6. 第一階段mock快速上線，第二階段統一接PostgreSQL真實DB。",
        "7. AIMS串接項目（#4、#11）需等AIMS對應模組完成後啟動。",
      ].map(t => new Paragraph({ spacing:{ after:100 }, children:[new TextRun({ text:t, size:18, font:"Arial" })] })),
    ]
  }]
});

// 執行：node docs/admin_progress_gen.js
// 輸出：docs/360醫療AI_Admin後台進度控管.docx
Packer.toBuffer(doc).then(b => {
  fs.writeFileSync("docs/360\u91ab\u7642AI_Admin\u5f8c\u53f0\u9032\u5ea6\u63a7\u7ba1.docx", b);
  console.log("\u2713 \u6587\u4ef6\u7522\u51fa\u5b8c\u6210\uff1adocs/360\u91ab\u7642AI_Admin\u5f8c\u53f0\u9032\u5ea6\u63a7\u7ba1.docx");
});
