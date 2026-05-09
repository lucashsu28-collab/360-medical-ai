// ════════════════════════════════
// data/clinics.ts
// ════════════════════════════════
export interface ClinicScores {
  judicial: number;
  google: number;
  legal: number;
  media: number;
  penalty: number;
  total: number;
}

export interface Clinic {
  id: string;
  name: string;
  type: string;
  address: string;
  district: string;
  tags: string[];
  isPartner: boolean;
  scores: ClinicScores;
  reviewCount: number;
  imagePlaceholder: string;
}

export const clinics: Clinic[] = [
  { id:"c01", name:"晶緻醫美診所", type:"醫美診所", address:"台北市信義區忠孝東路五段123號", district:"信義區", tags:["皮秒雷射","玻尿酸","肉毒桿菌"], isPartner:true, scores:{judicial:9.6,google:9.2,legal:10.0,media:8.8,penalty:9.0,total:9.4}, reviewCount:1247, imagePlaceholder:"🏥" },
  { id:"c02", name:"璞真整形外科診所", type:"整形外科", address:"台北市大安區敦化南路一段88號", district:"大安區", tags:["雙眼皮","隆鼻","拉皮","縮鼻翼"], isPartner:true, scores:{judicial:10.0,google:8.8,legal:10.0,media:8.5,penalty:8.2,total:8.9}, reviewCount:983, imagePlaceholder:"💉" },
  { id:"c03", name:"悅顏皮膚科診所", type:"皮膚科", address:"台北市中山區中山北路二段33號", district:"中山區", tags:["皮秒","淡斑","痘疤","保濕療程"], isPartner:true, scores:{judicial:9.5,google:8.7,legal:10.0,media:7.8,penalty:9.0,total:8.7}, reviewCount:756, imagePlaceholder:"✨" },
  { id:"c04", name:"凰漾美學診所", type:"醫美診所", address:"新北市板橋區文化路一段56號", district:"板橋區", tags:["電波拉皮","超音波","體雕"], isPartner:true, scores:{judicial:9.8,google:8.4,legal:10.0,media:8.2,penalty:7.9,total:9.1}, reviewCount:512, imagePlaceholder:"🌿" },
  { id:"c05", name:"臻美整形診所", type:"整形外科", address:"台北市松山區民生東路三段142號", district:"松山區", tags:["抽脂","豐胸","腹部整形"], isPartner:false, scores:{judicial:9.2,google:9.1,legal:10.0,media:8.0,penalty:8.6,total:9.1}, reviewCount:389, imagePlaceholder:"💆" },
  { id:"c06", name:"光澤皮膚科診所", type:"皮膚科", address:"台北市內湖區瑞光路288號", district:"內湖區", tags:["飛梭雷射","淨膚","光子嫩膚"], isPartner:true, scores:{judicial:10.0,google:8.6,legal:10.0,media:7.5,penalty:8.8,total:8.8}, reviewCount:634, imagePlaceholder:"🔆" },
  { id:"c07", name:"薇采醫美診所", type:"醫美診所", address:"台北市士林區中山北路六段55號", district:"士林區", tags:["玻尿酸","童顏針","晶亮瓷"], isPartner:true, scores:{judicial:9.0,google:8.9,legal:10.0,media:8.3,penalty:8.7,total:8.9}, reviewCount:478, imagePlaceholder:"💎" },
  { id:"c08", name:"湛藍整形外科診所", type:"整形外科", address:"台北市中正區羅斯福路二段77號", district:"中正區", tags:["鼻整形","眼整形","臉部輪廓"], isPartner:false, scores:{judicial:8.5,google:8.2,legal:10.0,media:7.0,penalty:7.8,total:8.3}, reviewCount:291, imagePlaceholder:"🔬" },
  { id:"c09", name:"千代醫美診所", type:"醫美診所", address:"新北市新莊區中正路500號", district:"新莊區", tags:["美白針","排毒療程","皮膚管理"], isPartner:false, scores:{judicial:7.8,google:7.5,legal:10.0,media:6.8,penalty:7.2,total:7.7}, reviewCount:188, imagePlaceholder:"🌸" },
  { id:"c10", name:"雙星皮膚科診所", type:"皮膚科", address:"台北市文山區木柵路三段22號", district:"文山區", tags:["痘痘治療","敏感修護","痘疤雷射"], isPartner:true, scores:{judicial:9.8,google:8.3,legal:10.0,media:7.6,penalty:8.5,total:8.6}, reviewCount:423, imagePlaceholder:"⭐" },
  { id:"c11", name:"禾澄醫美診所", type:"醫美診所", address:"桃園市中壢區中山路101號", district:"中壢區", tags:["皮秒雷射","電波拉皮","玻尿酸"], isPartner:true, scores:{judicial:9.4,google:8.7,legal:10.0,media:8.0,penalty:8.4,total:8.8}, reviewCount:367, imagePlaceholder:"🏥" },
  { id:"c12", name:"典雅整形外科診所", type:"整形外科", address:"台中市西屯區台灣大道三段888號", district:"西屯區", tags:["雙眼皮","臥蠶","眼袋"], isPartner:true, scores:{judicial:9.6,google:9.0,legal:10.0,media:8.5,penalty:9.1,total:9.3}, reviewCount:812, imagePlaceholder:"💉" },
  { id:"c13", name:"森澤皮膚科診所", type:"皮膚科", address:"台中市北區學士路66號", district:"北區", tags:["染料雷射","紅血絲","酒糟治療"], isPartner:false, scores:{judicial:8.8,google:8.1,legal:10.0,media:7.2,penalty:8.0,total:8.4}, reviewCount:234, imagePlaceholder:"✨" },
  { id:"c14", name:"絲漾醫美診所", type:"醫美診所", address:"台南市東區東門路一段200號", district:"東區", tags:["超音波拉皮","埋線拉提","肉毒"], isPartner:true, scores:{judicial:9.9,google:8.8,legal:10.0,media:8.3,penalty:8.6,total:9.1}, reviewCount:556, imagePlaceholder:"🌿" },
  { id:"c15", name:"悠美整形診所", type:"整形外科", address:"高雄市苓雅區四維三路33號", district:"苓雅區", tags:["抽脂","隆乳","眼整形"], isPartner:true, scores:{judicial:9.2,google:8.5,legal:10.0,media:7.8,penalty:8.3,total:8.7}, reviewCount:445, imagePlaceholder:"💆" },
  { id:"c16", name:"煜美皮膚科診所", type:"皮膚科", address:"高雄市前鎮區中華五路1000號", district:"前鎮區", tags:["除毛雷射","美白","保濕"], isPartner:false, scores:{judicial:8.0,google:7.8,legal:10.0,media:6.5,penalty:7.6,total:7.8}, reviewCount:167, imagePlaceholder:"🔆" },
  { id:"c17", name:"凌頂醫美診所", type:"醫美診所", address:"新北市永和區中正路399號", district:"永和區", tags:["皮秒雷射","童顏針","體雕減脂"], isPartner:true, scores:{judicial:9.7,google:8.9,legal:10.0,media:8.4,penalty:8.8,total:9.2}, reviewCount:689, imagePlaceholder:"💎" },
  { id:"c18", name:"蘭亭整形外科診所", type:"整形外科", address:"台北市信義區松仁路88號", district:"信義區", tags:["全臉拉皮","眉提術","淚溝填補"], isPartner:false, scores:{judicial:7.2,google:7.0,legal:10.0,media:6.2,penalty:6.8,total:7.2}, reviewCount:98, imagePlaceholder:"🔬" },
  { id:"c19", name:"晨曦皮膚科診所", type:"皮膚科", address:"桃園市桃園區復興路200號", district:"桃園區", tags:["IPL光子","淡斑","縮毛孔"], isPartner:true, scores:{judicial:9.3,google:8.6,legal:10.0,media:7.9,penalty:8.7,total:8.8}, reviewCount:341, imagePlaceholder:"🌸" },
  { id:"c20", name:"雅緻醫美診所", type:"醫美診所", address:"新北市三重區重新路五段609號", district:"三重區", tags:["玻尿酸","肉毒","淨膚雷射"], isPartner:false, scores:{judicial:6.5,google:7.2,legal:10.0,media:5.8,penalty:6.9,total:6.9}, reviewCount:76, imagePlaceholder:"⭐" },
];
