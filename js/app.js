$(function(){
	var i, j, k;
	//一次比幾個
	var n = 3;
	//正在比的id
	var fighting = [];
	//初始資料
	var data = [];
	for (i=0; i<original_data.length; i++) {
		data.push($.extend(original_data[i], {id: i+1, sort_key:1, loser:[]}));
	}
	
	//陣列洗牌
	var shuffle = function (o){ //v1.0
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	
	/**
	 * 遞迴累加手下敗將的sort_key
	 * @param int sort_key 最低排序值
	 * @param array loser_list 手下敗將陣列
	 */
	var loserHandler = function(sort_key, loser_list) {
		if ($.isArray(loser_list) && loser_list.length > 0) {
			for (i in loser_list) {
				if (loser_list[i].sort_key <= sort_key) {
					loser_list[i].sort_key = sort_key + 1;
					//遞迴
					loserHandler(sort_key+1, loser_list[i].loser);
				}
			}
		}
	};
	
	//即時呈現資料狀態
	$("div#data").on("reload", function(){
		$(this).empty();
		var $table = $("<table />");
		var $tr0 = $("<tr />");
		var $tr1 = $("<tr />");
		var $tr2 = $("<tr />");
		var arr = data;
		arr.sort(function(a, b){
			if (a.sort_key == b.sort_key)
				return a.id - b.id;
			return a.sort_key - b.sort_key;
		});
		for (i in arr) {
			$tr0.append(
				$("<td rel='" + arr[i].id + "' />").append(
					$("<a />")
					.text("勝！")
					.attr({
						href: "javascript:void(0)",
						"class": "rank rank_"+arr[i].sort_key,
						"rel": arr[i].id,
						"sort_key": arr[i].sort_key,
						"name": arr[i].name
					})
				)
			);
			$tr1.append($("<td rel='" + arr[i].id + "' />").html(arr[i].firm));
			$tr2.append($("<td rel='" + arr[i].id + "' />").html(arr[i].sort_key));
		}
		$table.append($tr0).append($tr1).append($tr2).appendTo($(this));
	})
	//勝利
	.delegate("a.rank", "click", function(e){
		var id = $(this).attr("rel");
		var name = $(this).attr("name");
		var sort_key = $(this).attr("sort_key");
		
		if (confirm("確定將"+name+"設定為第"+sort_key+"志願？")) {
			for(i in data) {
				if (data[i].id != id && data[i].sort_key >= sort_key) {
					data[i].sort_key++;
				}
			}
			//清空挑戰區
			fighting = [];
			//重新載入所有區塊
			$("div#data, div#challenge").trigger("reload");
		}
	});
	$("div#data").trigger("reload");
	
	//挑戰區
	$("div#challenge")
	//重挑對手
	.on("reload", function(){
		$(this).empty();
		$("a.rank").hide();
		//挑戰區數量未滿
		if (fighting.length < n) {
			//依sort_key分組
			var group = [];
			for (i=0; i<data.length; i++) {
				if (data[i].sort_key in group) {
					group[data[i].sort_key].push(data[i]);
				} else {
					group[data[i].sort_key] = [data[i]];
				}
			}
			
			//挑戰者
			var challenger = [];
			//從sort_key最低的開始找數量大於1的組別
			for (i in group) {
				if (group[i].length > 1) {
					//如果挑戰區剩下的不是這個sort_key的組員
					//表示該組比完了, 清空挑戰區
					if (fighting.length > 0) {
						if (fighting[0].sort_key != i) {
							fighting = [];
						}
					}
					
					$("a.rank_"+i).show();
					
					var fighter_id = $.map(fighting, function(item){return item.id;});
					//挑戰區還差k個
					k = n - fighting.length;
					//洗牌
					group[i] = shuffle(group[i]);
					for (j=0;j<group[i].length && k>0;j++) {
						if (fighter_id.indexOf(group[i][j].id) < 0) {
							challenger.push(group[i][j]);
							k--;
						}
					}
					break;
				}
			}
			//挑戰者加入挑戰區
			for (i in challenger) {
				fighting.push(challenger[i]);
			}
			if (fighting.length > 1) {
				//顯示挑戰區
				for (i in fighting) {
					var clone = $("div#challenger_template table").clone();
					$(".id", clone).html(fighting[i].id);
					$(".firm", clone).html(fighting[i].firm);
					$(".name", clone).html(fighting[i].name);
					$(".location", clone).html(fighting[i].location);
					$(".num", clone).html(fighting[i].num);
					$(".num1", clone).html(fighting[i].num1);
					$(".num2", clone).html(fighting[i].num2);
					$(".num3", clone).html(fighting[i].num3);
					$(".content", clone).html(fighting[i].content);
					$(".address", clone).html(fighting[i].address);
					$(".url", clone).append(
						$("<a />")
						.attr({
							href: fighting[i].url,
							target: "_blank"
						})
						.text(fighting[i].url)
					);
					$(".tel", clone).html(fighting[i].tel);
					$(".map", clone).append(
						$("<iframe />")
						.attr({
							width:"100%",
							height:"300",
							frameborder:"0"
						})
						.attr("src", "https://www.google.com/maps/embed/v1/place?q="+fighting[i].address+"&key=AIzaSyDG4nUdEzi2mfUhY-UhJqDctYRuv7ImyiM")
					);
					clone.appendTo($(this));
					
					//資料區highlight
					$("td[rel="+fighting[i].id+"]").css("background-color", "lightgreen");
				}
			}
		}
	})
	//勝利
	.delegate("a.win", "click", function(e){
		var winner_id = parseInt($(".id", $(e.target).closest("table")).html());
		var winner;
		var loser = [];
		for (i in fighting) {
			if (fighting[i].id != winner_id) {
				loser.push(fighting[i]);
				//累加淘汰者的sort_key
				fighting[i].sort_key = fighting[i].sort_key + 1;
				//淘汰者的手下敗將如果sort_key小於等於淘汰者, 手下敗將的sort_key改為淘汰者的sort_key+1
				loserHandler(fighting[i].sort_key, fighting[i].loser);
			} else {
				winner = fighting[i];
			}
		}
		//加入手下敗將
		var my_loser_id = $.map(winner.loser, function(item){return item.id;});
		for (i in loser) {
			if (my_loser_id.indexOf(loser[i].id) < 0) {
				winner.loser.push(loser[i]);
			}
		}
		
		//挑戰區留下勝利者
		fighting = [winner];
		//重新載入所有區塊
		$("div#data, div#challenge").trigger("reload");
	});
	$("div#challenge").trigger("reload");
});

var original_data = [
	{
		"firm": "經濟部國際貿易局",
		"name": "技士",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理業務。",
		"url": "www.trade.gov.tw",
		"address": "台北市湖口街1號",
		"tel": "02-23977457"
	},
	{
		"firm": "經濟部工業局",
		"name": "技士",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊產業發展之政策規劃與推動。(2)資訊產業發展相關計畫之研擬與執行。(3)數位內容產業相關業務之推動。(4)其他臨時交辦事項。",
		"url": "http://www.moeaidb.gov.tw/",
		"address": "台北市大安區信義路三段41之3號",
		"tel": "02-27541255分機3112"
	},
	{
		"firm": "經濟部智慧財產局",
		"name": "技士",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理專利資料庫檢索系統、資訊機房營運管理及資訊安全等相關事項。(2)其他交辦事項。",
		"url": "www.tipo.gov.tw",
		"address": "台北市辛亥路二段185號3樓",
		"tel": "02-23767617"
	},
	{
		"firm": "經濟部能源局",
		"name": "科員",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理資訊處理相關業務。",
		"url": "http://web3.moeaboe.gov.tw/ECW/populace/home/Home.",
		"address": "台北市復興北路2號13樓",
		"tel": "02-27757791"
	},
	{
		"firm": "交通部臺灣鐵路管理局資訊中心",
		"name": "電腦作業師",
		"location": "臺北市",
		"num": "2",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理本局資訊系統與電腦主機之規劃、維護、建置、及委外作業。(2)其他交辦事項。(3)本職缺係屬交通資位制，須經銓敘部銓敘審定。",
		"url": "http://www.railway.gov.tw/tw/",
		"address": "臺北市北平西路3號4樓",
		"tel": "02-23815226分機4260"
	},
	{
		"firm": "交通部公路總局",
		"name": "工務員",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理資訊處理相關業務。(2)本職缺係交通資位制，須經銓敘部銓敘審定。",
		"url": "http://www.thb.gov.tw/",
		"address": "台北市萬華區東園街65號",
		"tel": "02-23070123分機1154"
	},
	{
		"firm": "交通部公路總局第二區養護工程處",
		"name": "工務員",
		"location": "臺中市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊處理相關業務及其他臨時交辦事項。(2)本職缺係交通資位制，須經銓敘部銓敘審定。",
		"url": "http://thbtwo.thb.gov.tw/web/index.html",
		"address": "台中市西區大全街一二七號",
		"tel": "04-23715030分機523"
	},
	{
		"firm": "行政院原子能委員會核能研究所",
		"name": "技術員",
		"location": "桃園市",
		"num": "4",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊處理職系相關研發工作。(2)本職缺未來配合行政院組織調整，將隨同業務移撥至經濟及能源部能源研究所，屆時並以調整後情形為準。(3)本職缺職務列等為委任第4職等至第5職等或薦任第6職等，因機關業務需要，爰提報高考三級需用職缺。",
		"url": "http://www.iner.gov.tw",
		"address": "桃園市龍潭區佳安里文化路1000號",
		"tel": "03-4711400分機2102"
	},
	{
		"firm": "宜蘭縣政府消防局",
		"name": "技士",
		"location": "宜蘭縣",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "（1）辦理各項救災救護服務統計分析。（2）資通訊業務處理等事項。（3）其他臨時交辦事項。",
		"url": "http://fire.e-land.gov.tw/",
		"address": "宜蘭市舊城南路1號 ",
		"tel": "03-9365027分機2102"
	},
	{
		"firm": "新竹縣政府消防局",
		"name": "技士",
		"location": "新竹縣",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理資訊業務規劃及設備維護等相關業務。",
		"url": "http://fire.hsinchu.gov.tw/",
		"address": "新竹縣竹北市北崙里光明五街295號",
		"tel": "03-5513522分機765"
	},
	{
		"firm": "苗栗縣政府",
		"name": "管理師",
		"location": "苗栗縣",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理資訊處理相關業務。",
		"url": "http://www.miaoli.gov.tw/cht/",
		"address": "苗栗縣苗栗市府前路1號",
		"tel": "037-559578"
	},
	{
		"firm": "花蓮縣政府",
		"name": "管理師",
		"location": "花蓮縣",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理資訊處理職系相關業務。(2)其他臨時交辦事項。",
		"url": "http://www.hl.gov.tw/bin/home.php",
		"address": "花蓮縣花蓮市府前路17 號",
		"tel": "03-8227171分機302"
	},
	{
		"firm": "澎湖縣政府消防局",
		"name": "技士",
		"location": "澎湖縣",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "（1）辦理資訊處理業務。（2）其他交辦事項。",
		"url": "http://www.phfd.gov.tw/ch/home.jsp?mserno=201110060009&serno=201110060009&contlink=ap/announce.jsp",
		"address": "澎湖縣馬公市重光里四維路320號",
		"tel": "06-9263346分機6628"
	},
	{
		"firm": "基隆市政府",
		"name": "管理師",
		"location": "基隆市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊安全相關業務(含本府及所屬機關資安通報演練、本府電子郵件社交工程演練、資安自行查核等)。 (2)本府及各處全球資訊網站維護及管理。(3)應用層防火牆系統維護及管理。(4)政府資料開放平臺本府聯絡窗口。(5)年度硬體設備更換採購業務。(6)其他資訊管理業務。(7)其他臨時交辦事項。",
		"url": "http://www.klcg.gov.tw",
		"address": "基隆市義一路1號",
		"tel": "02-24201122分機1305"
	},
	{
		"firm": "臺北市政府民政局",
		"name": "管理師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)本局業務科室電腦軟硬體維護相關事宜。(2)本局地理資訊系統規劃、管理、訓練、地理資訊會議事宜。(3)本局網路電話及光纖網路會議相關事宜。(4)本局電腦相關設備採購事宜。(5)臨時交辦事項。",
		"url": "http://ca.gov.taipei/",
		"address": "臺北市信義區市府路1號9樓中央區",
		"tel": "02-27208889分機6205"
	},
	{
		"firm": "臺北市政府財政局",
		"name": "分析師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)本局集中支付-網站端系統(主辦)、主機端系統(協辦)、維護案。(2)本局AD帳號管理。(3)本局神網資產管理系統管理。(4)本局各科室電腦軟硬體維修。(5)其他臨時交辦事項。",
		"url": "http://www.dof.gov.taipei/",
		"address": "臺北市信義區市府路1號7、8樓中央區",
		"tel": "02-27208889分機1194"
	},
	{
		"firm": "臺北市政府財政局.",
		"name": "分析師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)本局資訊綜合業務。(2)本局資訊安全相關業務。(3)集中支付-網站端系統、主機端系統(協辦)。(4)本局各科室電腦軟硬體維修。(5)其他臨時交辦事項。",
		"url": "http://www.dof.gov.taipei/",
		"address": "臺北市信義區市府路1號7、8樓中央區",
		"tel": "02-27208889分機1194"
	},
	{
		"firm": "臺北市稅捐稽徵處",
		"name": "設計師",
		"location": "臺北市",
		"num": "2",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理相關業務。",
		"url": "http://www.tpctax.gov.taipei/",
		"address": "臺北市中正區北平東路7之2號",
		"tel": "02-23949211分機215"
	},
	{
		"firm": "臺北市動產質借處",
		"name": "管理師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理現行作業系統程式執行及管理維護、質借及臺北惜物網資訊等作業系統之整體規劃推展、電腦及周邊設備硬體管理維護等業務。",
		"url": "http://op.gov.taipei/",
		"address": "臺北市中山區長安西路3號6樓",
		"tel": "02-25629862分機71"
	},
	{
		"firm": "臺北市政府教育局",
		"name": "分析師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)本局及所屬學校資訊概算編列。(2)數位學生證服務整合平臺。(3)台北卡卡證採購案及履約管理。(4)資訊作業管考與評鑑及資訊局資訊業務評核。(5)本局所屬機關資訊設備預算審查事項-萬華區。(6)電腦諮詢小組。(7)其他臨時交辦事項。",
		"url": "http://www.doe.gov.taipei/",
		"address": "臺北市市府路1號4樓",
		"tel": "02-27256402"
	},
	{
		"firm": "臺北市政府教育局.",
		"name": "管理師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)本局電腦設備汰換及管理、評估未來局本部電腦租賃及維護採購案件、各校資訊設備更新評估及規劃各校資訊設備編列標準。(2)校園骨幹更新事宜及本市各級學校光纖網路相關事宜(含教育部計畫)。(3)統合視導彙整業務、電子公文相關事宜、益教網業務。(4)教育網路中心規劃事宜。(5)本局所屬機關資訊設備預算審查事項-士林區。(6)軟硬體暨網路等資訊相關業務維護與駐點人力專案管理。(7)其他臨時交辦事項。",
		"url": "http://www.doe.gov.taipei/",
		"address": "臺北市市府路1號4樓",
		"tel": "02-27256402"
	},
	{
		"firm": "臺北市政府工務局衛生下水道工程處",
		"name": "管理師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理資訊處理相關業務。(2)本機關為派用機關，配合派用人員派用條例於104年6月19日廢止，未來修編將改制為任用機關，屆時並以調整情形為準。",
		"url": "http://www.sso.gov.taipei/",
		"address": "臺北市大同區酒泉街235號(含處外單位)",
		"tel": "02-25973183分機511"
	},
	{
		"firm": "臺北市政府衛生局",
		"name": "設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理相關業務。",
		"url": "http://health.gov.taipei/",
		"address": "臺北市信義區市府路1號10樓西南區",
		"tel": "02-27208889分機7145"
	},
	{
		"firm": "臺北市政府主計處",
		"name": "管理師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "主計資訊業務。",
		"url": "http://dbas.gov.taipei/",
		"address": "臺北市信義區市府路1號10樓 ",
		"tel": "02-27287597"
	},
	{
		"firm": "臺北市政府人事處",
		"name": "設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)本處資訊安全相關業務。(2)本府人事資訊系統（獎懲、考績等子系統）之管理、維護及輔導作業。(3)本處辦公室自動化規劃、推動及權限帳號網域管理業務。(4)本處個人電腦資訊應用及技術支援事項。(5)人事系統輔導作業。(6)本府資訊化推動相關配合業務。(7)其他臨時交辦事項。",
		"url": "http://dop.gov.taipei/",
		"address": "臺北市信義區市府路1號11樓南區",
		"tel": "02-27287730"
	},
	{
		"firm": "臺北市政府交通局",
		"name": "設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊硬體之規劃、採購及管理業務。(2)資訊安全稽核及推廣業務。(3)其他交辦事項。",
		"url": "http://www.dot.gov.taipei/",
		"address": "臺北市市府路1號6樓北區",
		"tel": "02-27256942"
	},
	{
		"firm": "臺北市交通管制工程處",
		"name": "設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊業務之整體規劃、設計、協調與推動等事項。",
		"url": "http://www.bote.gov.taipei/",
		"address": "臺北市信義區松德路300號",
		"tel": "02-27599741分機7601"
	},
	{
		"firm": "臺北市建築管理工程處",
		"name": "設計師管理師",
		"location": "臺北市",
		"num": "2",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理資訊處理相關業務。",
		"url": "http://dba.gov.taipei/",
		"address": "臺北市市府路1號2樓南區",
		"tel": "02-27258474 "
	},
	{
		"firm": "臺北市政府觀光傳播局",
		"name": "管理師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理本局資訊、觀光旅遊網等相關業務及配合本府資訊政策辦理相關業務。(2)其他臨時交辦事項。",
		"url": "http://www.tpedoit.gov.taipei/",
		"address": "臺北市市府路1號4樓中央區",
		"tel": "02-27208889分機2042"
	},
	{
		"firm": "臺北市政府觀光傳播局",
		"name": "管理師",
		"location": "臺北市",
		"num": "0",
		"num1": "0",
		"num2": "1",
		"num3": "0",
		"content": "(1)辦理本局資訊、觀光旅遊網等相關業務及配合本府資訊政策辦理相關業務。(2)其他臨時交辦事項。",
		"url": "http://www.tpedoit.gov.taipei/",
		"address": "臺北市市府路1號4樓中央區",
		"tel": "02-27208889分機2042"
	},
	{
		"firm": "臺北市政府公務人員訓練處",
		"name": "分析師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)行政區及圖書館電腦軟硬體維護。(2)本處機關中英文網站維護、管理、定期檢核。(3)電子公文處理整合系統管理及使用者電腦環境設定、問題排除。(4)網域帳號管理及新進使用者電腦環境設定、內部郵件管理、公用資料夾、檔案共用區管理。(5)其他如市府員工電子郵件信箱、單一申訴、集中支付等資訊系統管理。(6)資訊安全及資料備份、資訊業務評核(協辦)等相關業務。(7)其他臨時交辦事項。",
		"url": "http://dcsd.gov.taipei/",
		"address": "台北市文山區萬美街2段21巷20號",
		"tel": "02-29320212分機330"
	},
	{
		"firm": "臺北市政府地政局",
		"name": "設計師管理師",
		"location": "臺北市",
		"num": "3",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)地政資訊系統規劃與設計維護事項。(2)資訊系統授權、稽查等。(3)電腦設備財產管理及耗材採購等。(4)電腦機房輪值。(5)資安文件管理。(6)其他臨時交辦事項。",
		"url": "http://www.land.gov.taipei/",
		"address": "臺北市市府路1號3樓北區",
		"tel": "02-27287329"
	},
	{
		"firm": "臺北市政府資訊局",
		"name": "設計師管理師設計師",
		"location": "臺北市",
		"num": "4",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理業務。",
		"url": "http://doit.gov.taipei/",
		"address": "臺北市信義區市府路1號10樓 ",
		"tel": "02-27258547"
	},
	{
		"firm": "桃園市蘆竹地政事務所",
		"name": "管理師",
		"location": "桃園市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "地政資訊業務。",
		"url": "http://www.ljland.gov.tw",
		"address": "桃園市蘆竹區長安路2段236號1至3樓",
		"tel": "03-3525337分機701"
	},
	{
		"firm": "桃園市政府經濟發展局",
		"name": "管理師",
		"location": "桃園市",
		"num": "0",
		"num1": "0",
		"num2": "1",
		"num3": "0",
		"content": "(1)本局年度資訊計畫及預算撰擬、執行及列管。(2)資訊軟硬體採購、技術支援業務。(3)資訊教育訓練相關業務。",
		"url": "http://edb.tycg.gov.tw/",
		"address": "桃園市桃園區縣府路1號2樓",
		"tel": "03-3322101分機5156"
	},
	{
		"firm": "桃園市政府交通局(含所屬機關)",
		"name": "管理師",
		"location": "桃園市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理相關工作。",
		"url": "http://traffic.tycg.gov.tw/",
		"address": "桃園市桃園區縣府路1號8樓",
		"tel": "03-3322101分機6854"
	},
	{
		"firm": "新北市政府稅捐稽徵處",
		"name": "管理師",
		"location": "新北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資料庫及網路系統管理。",
		"url": "http://www.tax.ntpc.gov.tw/",
		"address": "新北市板橋區中山路1段143號",
		"tel": "02-89528259"
	},
	{
		"firm": "新北市板橋地政事務所",
		"name": "管理師",
		"location": "新北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理地政資訊相關業務。",
		"url": "http://www.banqiao.land.ntpc.gov.tw",
		"address": "新北市板橋區實踐路1號",
		"tel": "02-29611126分機600"
	},
	{
		"firm": "新北市政府資訊中心",
		"name": "管理師",
		"location": "新北市",
		"num": "2",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理本中心資訊相關業務。",
		"url": "http://www.imc.ntpc.gov.tw",
		"address": "新北市板橋區中山路1段161號16樓",
		"tel": "02-29603456分機8510"
	},
	{
		"firm": "新北市政府勞工局",
		"name": "管理師",
		"location": "新北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理資訊處理相關業務。(2)其他臨時交辦事項。",
		"url": "http://www.labor.ntpc.gov.tw",
		"address": "新北市板橋區中山路1段161號",
		"tel": "02-29603456分機6433"
	},
	{
		"firm": "新北市政府水利局",
		"name": "管理師",
		"location": "新北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊處理相關業務。(2)其他臨時交辦業務。",
		"url": "http://www.wrs.ntpc.gov.tw",
		"address": "新北市板橋區中山路1段161號29樓",
		"tel": "02-29603456分機4886"
	},
	{
		"firm": "新北市政府農業局",
		"name": "管理師",
		"location": "新北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理資訊相關業務。(2)其他臨時交辦事項。",
		"url": "http://www.agriculture.ntpc.gov.tw",
		"address": "新北市板橋區中山路1段161號22樓",
		"tel": "02-29603456分機2937"
	},
	{
		"firm": "新北市政府城鄉發展局",
		"name": "管理師",
		"location": "新北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理資訊相關業務及其他臨時交辦事項。",
		"url": "http://www.planning.ntpc.gov.tw",
		"address": "新北市板橋區中山路1段161號11樓",
		"tel": "02-29603456分機7026"
	},
	{
		"firm": "新北市政府消防局",
		"name": "技士",
		"location": "新北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理相關業務。",
		"url": "http://www.fire.ntpc.gov.tw",
		"address": "新北市板橋區南雅南路2段15號",
		"tel": "02-89519119分機8313"
	},
	{
		"firm": "高雄市政府工務局養護工程處",
		"name": "管理師",
		"location": "高雄市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理資訊處理等相關業務，及其他上級長官臨時交辦事項。",
		"url": "http://pwbmo.kcg.gov.tw/",
		"address": "高雄市苓雅區四維三路2號5樓",
		"tel": "07-3368333分機2387"
	},
	{
		"firm": "高雄市政府環境保護局",
		"name": "管理師",
		"location": "高雄市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理資訊處理相關業務。",
		"url": "http://www.ksepb.gov.tw/",
		"address": "高雄市鳥松區澄清路834號",
		"tel": "07-7351500分機1706"
	},
	{
		"firm": "司法院",
		"name": "助理設計師",
		"location": "臺北市",
		"num": "2",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)關於各應用系統撰寫及維護等事項。(2)關於資訊軟體之維護及管理等事項。(3)關於輸出入資料、作業程式及資料檔案之彙整管理事項。(4)其他臨時交辦事項。",
		"url": "http://www.judicial.gov.tw/",
		"address": "臺北市中正區重慶南路一段124 號",
		"tel": "02-23618577分機410"
	},
	{
		"firm": "考選部",
		"name": "設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理考試試務系統資訊處理業務相關工作。",
		"url": "http://www.moex.gov.tw",
		"address": "臺北市文山區試院路1-1號",
		"tel": "02-22369188分機3246"
	},
	{
		"firm": "審計部",
		"name": "稽察員",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)辦理資訊應用系統開發及維護。(2)辦理電腦審計工作。",
		"url": "http://www.audit.gov.tw",
		"address": "臺北市杭州北路1號 ",
		"tel": "02-23977806"
	},
	{
		"firm": "行政院",
		"name": "助理設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "（1）協辦科發基金計畫行政作業。（2）協辦資安責任等級分級及重要業務管考相關事宜。（3）協辦公務聯絡作業。（4）臨時交辦事項。",
		"url": "http://www.ey.gov.tw/",
		"address": "台北市忠孝東路一段1號",
		"tel": "02-33567018"
	},
	{
		"firm": "財政部臺北國稅局(含所屬機關)",
		"name": "管理師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "主機、伺服器及網路等設備管理。 ",
		"url": "http://www.ntbt.gov.tw/",
		"address": "臺北市萬華區中華路1段2號",
		"tel": "02-23113711分機2714"
	},
	{
		"firm": "財政部高雄國稅局(含所屬機關)",
		"name": "管理師",
		"location": "高雄市",
		"num": "2",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)主機、網路、資料庫、軟硬體設備等資訊系統基礎平台(Infrastructure)相關作業及安全之管理。(2)網路通訊作業及安全管理。(3)資訊系統基礎平台(Infrastructure)相關作業及安全管理。",
		"url": "http://www.ntbk.gov.tw/",
		"address": "高雄市苓雅區廣州一街一四八號",
		"tel": "07-7256600分機8112"
	},
	{
		"firm": "財政部財政資訊中心",
		"name": "助理程式設計師",
		"location": "臺北市",
		"num": "6",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊系統管理維護。",
		"url": "http://www.fia.gov.tw",
		"address": "台北市信義區忠孝東路四段五四七號",
		"tel": "02-27631833分機1273"
	},
	{
		"firm": "國立成功大學",
		"name": "技士",
		"location": "臺南市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "（1）網路管理、主機管理、資訊作業規劃設計。（2）機電設施管理及資訊安全管理。（3）網頁設計、程式增修。（4）微電腦室管理。（5）其他交辦事項。",
		"url": "http://web.ncku.edu.tw/bin/home.php",
		"address": "臺南市大學路1號",
		"tel": "06-2757575分機50862"
	},
	{
		"firm": "國立空中大學",
		"name": "技士",
		"location": "新北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "處理本校資訊業務。",
		"url": "suh3736@mail.nou.edu.tw",
		"address": "新北市蘆洲區中正路172號",
		"tel": "02-22829355分機5912"
	},
	{
		"firm": "國立中正大學",
		"name": "技士",
		"location": "嘉義縣",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理。",
		"url": "http://www.ccu.edu.tw/",
		"address": "嘉義縣民雄鄉大學路168號",
		"tel": "05-2720411分機18115"
	},
	{
		"firm": "勞動部勞工保險局",
		"name": "助理程式設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "辦理有關資訊處理相關業務。",
		"url": "www.bli.gov.tw",
		"address": "台北市羅斯福路一段四號",
		"tel": "02-23961266分機2945"
	},
	{
		"firm": "勞動部勞工保險局",
		"name": "助理程式設計師",
		"location": "臺北市",
		"num": "0",
		"num1": "3",
		"num2": "0",
		"num3": "0",
		"content": "辦理有關資訊處理相關業務。",
		"url": "www.bli.gov.tw",
		"address": "台北市羅斯福路一段四號",
		"tel": "02-23961266分機2945"
	},
	{
		"firm": "衛生福利部",
		"name": "設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "（1）資訊業務規劃、分析、設計等事項。（2）資訊系統維護管理、作業諮詢及操作訓練等事項。（3）其他臨時交辦事項。",
		"url": "http://www.mohw.gov.tw/",
		"address": "臺北市南港區忠孝東路6段488號",
		"tel": "02-85907823"
	},
	{
		"firm": "衛生福利部食品藥物管理署",
		"name": "設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "（1）資訊系統架構與發展規劃。（2）資訊採購與委外專案管理。（3）資訊作業環境規劃與管理。（4）其他臨時交辦事項。",
		"url": "http://www.fda.gov.tw/TC/index.aspx",
		"address": "臺北市南港區昆陽街161-2號 ",
		"tel": "02-27877924"
	},
	{
		"firm": "衛生福利部中央健康保險署",
		"name": "助理程式設計師",
		"location": "臺北市",
		"num": "3",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "（1）辦理全民健保資訊處理職系相關業務。（2）其他臨時交辦事項。",
		"url": "http://www.nhi.gov.tw/",
		"address": "臺北市大安區信義路三段140號",
		"tel": "02-27065866分機2376"
	},
	{
		"firm": "國軍退除役官兵輔導委員會屏東榮譽國民之家",
		"name": "技術員",
		"location": "屏東縣",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊處理及行政文書管理相關業務。(2)其他臨時交辦事項。備註:本職缺職務列等為委任第4職等至第5職等或薦任第6職等，因機關業務需要，爰提報高考三級需用職缺。",
		"url": "http://www.vac.gov.tw/vac_home/pingtung/home/index.asp",
		"address": "屏東縣內埔鄉建興村100號",
		"tel": "08-7701621分機205"
	},
	{
		"firm": "臺北榮民總醫院",
		"name": "設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理。",
		"url": "www.vghtpe.gov.tw",
		"address": "台北市北投石牌路二段201號 ",
		"tel": "02-28757019分機318"
	},
	{
		"firm": "臺北榮民總醫院，",
		"name": "助理設計師",
		"location": "臺北市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "資訊處理。備註:本職缺職務列等為委任第4職等至第5職等或薦任第6職等，因機關業務需要，爰提報高考三級需用職缺。",
		"url": "www.vghtpe.gov.tw",
		"address": "台北市北投石牌路二段201號 ",
		"tel": "02-28757019分機318"
	},
	{
		"firm": "臺中榮民總醫院",
		"name": "設計師",
		"location": "臺中市",
		"num": "1",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊處理相關業務。(2)醫療應用系統開發。(3)現行醫療應用系統維護及各類申請單處理作業。(4)臨時交辦事項。",
		"url": "http://www.vghtc.gov.tw/home/index.html",
		"address": "臺中市西屯區臺灣大道四段1650號",
		"tel": "04-23592525分機2416"
	},
	{
		"firm": "行政院主計總處主計資訊處",
		"name": "助理設計師",
		"location": "臺北市",
		"num": "2",
		"num1": "0",
		"num2": "0",
		"num3": "0",
		"content": "(1)資訊處理業務。(2)本職缺職務列等為委任第4職等至第5職等或薦任第6職等，因機關業務需要，爰提報高考三級需用職缺。",
		"url": "http://www.dgbas.gov.tw/mp.asp?mp=1",
		"address": "臺北市忠孝東路一段1號",
		"tel": "02-23803864"
	},
	{
		"firm": "中央銀行",
		"name": "辦事員",
		"location": "臺北市",
		"num": "0",
		"num1": "2",
		"num2": "0",
		"num3": "0",
		"content": "(2)資訊處理相關工作。(2)本職缺毋須經銓敘部銓敘審定，退撫係依中央銀行人事管理準則規定，採1次全額給付。",
		"url": "http://www.cbc.gov.tw/",
		"address": "台北市羅斯福路一段2號",
		"tel": "02-2357-1854"
	}
];