// ════════════════════════════════
// data/doctors.ts
// ════════════════════════════════
export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  clinicId: string;
  clinicName: string;
  clinicScore: number;
  specs: string[];
  licenseValid: boolean;
  disputeCount: number;
  yearsOfPractice: number;
  district: string;
}

export const doctors: Doctor[] = [
  { id:"d01", name:"王明哲 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c02", clinicName:"璞真整形外科診所", clinicScore:8.9, specs:["皮秒雷射","玻尿酸","雙眼皮","隆鼻"], licenseValid:true, disputeCount:0, yearsOfPractice:12, district:"台北市" },
  { id:"d02", name:"李雅婷 醫師", title:"皮膚科專科醫師", specialty:"皮膚科", clinicId:"c03", clinicName:"悅顏皮膚科診所", clinicScore:8.7, specs:["皮秒","淡斑","痘疤","皮膚管理"], licenseValid:true, disputeCount:0, yearsOfPractice:8, district:"台北市" },
  { id:"d03", name:"陳志遠 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c02", clinicName:"璞真整形外科診所", clinicScore:8.9, specs:["雙眼皮","隆鼻","縮鼻翼","拉皮"], licenseValid:true, disputeCount:0, yearsOfPractice:15, district:"台北市" },
  { id:"d04", name:"林佩君 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c05", clinicName:"臻美整形診所", clinicScore:9.1, specs:["抽脂","豐胸","腹部整形"], licenseValid:true, disputeCount:1, yearsOfPractice:9, district:"台北市" },
  { id:"d05", name:"張世豪 醫師", title:"皮膚科專科醫師", specialty:"皮膚科", clinicId:"c06", clinicName:"光澤皮膚科診所", clinicScore:8.8, specs:["飛梭雷射","淨膚","光子嫩膚","除毛"], licenseValid:true, disputeCount:0, yearsOfPractice:11, district:"台北市" },
  { id:"d06", name:"吳欣儀 醫師", title:"醫學美容醫師", specialty:"微整形", clinicId:"c01", clinicName:"晶緻醫美診所", clinicScore:9.4, specs:["玻尿酸","肉毒桿菌","晶亮瓷","童顏針"], licenseValid:true, disputeCount:0, yearsOfPractice:7, district:"台北市" },
  { id:"d07", name:"黃建民 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c12", clinicName:"典雅整形外科診所", clinicScore:9.3, specs:["雙眼皮","臥蠶","眼袋","眼整形"], licenseValid:true, disputeCount:0, yearsOfPractice:18, district:"台中市" },
  { id:"d08", name:"蔡宜蓉 醫師", title:"皮膚科專科醫師", specialty:"皮膚科", clinicId:"c10", clinicName:"雙星皮膚科診所", clinicScore:8.6, specs:["痘痘治療","敏感修護","痘疤雷射"], licenseValid:true, disputeCount:0, yearsOfPractice:6, district:"台北市" },
  { id:"d09", name:"許志偉 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c15", clinicName:"悠美整形診所", clinicScore:8.7, specs:["抽脂","隆乳","眼整形","腹部整形"], licenseValid:true, disputeCount:0, yearsOfPractice:13, district:"高雄市" },
  { id:"d10", name:"劉芳如 醫師", title:"醫學美容醫師", specialty:"雷射", clinicId:"c11", clinicName:"禾澄醫美診所", clinicScore:8.8, specs:["皮秒雷射","電波拉皮","玻尿酸"], licenseValid:true, disputeCount:0, yearsOfPractice:5, district:"桃園市" },
  { id:"d11", name:"鄭俊傑 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c08", clinicName:"湛藍整形外科診所", clinicScore:8.3, specs:["鼻整形","眼整形","臉部輪廓"], licenseValid:true, disputeCount:0, yearsOfPractice:10, district:"台北市" },
  { id:"d12", name:"洪雅雯 醫師", title:"皮膚科專科醫師", specialty:"皮膚科", clinicId:"c13", clinicName:"森澤皮膚科診所", clinicScore:8.4, specs:["染料雷射","紅血絲","酒糟治療"], licenseValid:true, disputeCount:0, yearsOfPractice:9, district:"台中市" },
  { id:"d13", name:"曾裕翔 醫師", title:"醫學美容醫師", specialty:"微整形", clinicId:"c14", clinicName:"絲漾醫美診所", clinicScore:9.1, specs:["超音波拉皮","埋線拉提","肉毒"], licenseValid:true, disputeCount:0, yearsOfPractice:8, district:"台南市" },
  { id:"d14", name:"方淑芬 醫師", title:"皮膚科專科醫師", specialty:"皮膚科", clinicId:"c19", clinicName:"晨曦皮膚科診所", clinicScore:8.8, specs:["IPL光子","淡斑","縮毛孔"], licenseValid:true, disputeCount:0, yearsOfPractice:7, district:"桃園市" },
  { id:"d15", name:"江文彥 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c17", clinicName:"凌頂醫美診所", clinicScore:9.2, specs:["皮秒雷射","童顏針","體雕減脂"], licenseValid:true, disputeCount:0, yearsOfPractice:14, district:"新北市" },
  { id:"d16", name:"廖美珍 醫師", title:"皮膚科專科醫師", specialty:"皮膚科", clinicId:"c04", clinicName:"凰漾美學診所", clinicScore:9.1, specs:["電波拉皮","超音波","體雕"], licenseValid:true, disputeCount:0, yearsOfPractice:10, district:"新北市" },
  { id:"d17", name:"謝承翰 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c18", clinicName:"蘭亭整形外科診所", clinicScore:7.2, specs:["全臉拉皮","眉提術","淚溝填補"], licenseValid:true, disputeCount:2, yearsOfPractice:16, district:"台北市" },
  { id:"d18", name:"沈怡君 醫師", title:"醫學美容醫師", specialty:"雷射", clinicId:"c07", clinicName:"薇采醫美診所", clinicScore:8.9, specs:["玻尿酸","童顏針","晶亮瓷"], licenseValid:true, disputeCount:0, yearsOfPractice:6, district:"台北市" },
  { id:"d19", name:"余昆霖 醫師", title:"整形外科專科醫師", specialty:"整形外科", clinicId:"c12", clinicName:"典雅整形外科診所", clinicScore:9.3, specs:["鼻整形","下巴整形","臉部輪廓"], licenseValid:true, disputeCount:0, yearsOfPractice:11, district:"台中市" },
  { id:"d20", name:"潘靜宜 醫師", title:"皮膚科專科醫師", specialty:"皮膚科", clinicId:"c16", clinicName:"煜美皮膚科診所", clinicScore:7.8, specs:["除毛雷射","美白","保濕"], licenseValid:true, disputeCount:0, yearsOfPractice:4, district:"高雄市" },
];
