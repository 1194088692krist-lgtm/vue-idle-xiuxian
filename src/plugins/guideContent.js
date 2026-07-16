export const guideHtml = `<h1>《修仙挂机录》完整攻略手册</h1>

<strong>当前版本：v1.3.1 · 神兵天工（2026-07-15）</strong>

<blockquote>一份基于游戏真实代码与数值的详尽攻略，覆盖两大核心系统（人物+装备）、宗门体系、角色定位、资源体系、修炼突破、装备 Build、灵宠、挂机探索、分区难度、抽卡、丹药、战斗公式与进阶策略。</blockquote>

<hr>

<h2>🎯 核心玩法速览</h2>

<blockquote><strong>最重要的认知</strong>：本游戏战力由<strong>两大核心系统</strong>构成——<strong>人物系统约占40%</strong>，<strong>装备系统约占60%</strong>。优先理解和投入这两大系统，是提升战力的最快途径。</blockquote>

<table>
<tr><td>系统</td><td>权重</td><td>核心内容</td><td>提升途径</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>🧍 人物系统</strong></td><td><strong>40%</strong></td><td>天赋值、努力值、天赋技能、角色定位、灵宠加成</td><td>抽卡招募、培元丹、回炉重造升星、灵宠培养</td></tr>

<tr><td><strong>⚔️ 装备系统</strong></td><td><strong>60%</strong></td><td>12件装备+法宝、6档品质、12级强化、洗练词条、10套套装</td><td>挂机掉落、抽卡、强化、洗练、套装收集</td></tr>

</tbody>

</table>

<h3>战力构成总览</h3>

<pre><code>角色战力 = (人物裸分 × 0.4 + 装备分 × 0.6) × 等级倍率

├── 人物裸分（40%权重）
│   ├── 基础属性分（攻击/生命/防御/速度）
│   ├── 天赋技能分
│   └── 灵宠分
│
├── 装备分（60%权重）
│   ├── 12件装备评分
│   └── 套装激活分
│
└── 等级倍率 = 1 + (等级-1) × 0.02
</code></pre>

<ul>

<li><strong>装备是第一生产力</strong>：60%的权重意味着装备的提升对战力影响更大，优先追求高品质、高强化、好词条、套装齐全；</li>

</ul>

<ul>

<li><strong>人物是基础底盘</strong>：40%的权重提供稳定的属性基底，天赋值和努力值决定了角色的上限；</li>

</ul>

<ul>

<li><strong>两者相辅相成</strong>：人物基础属性越高，装备加成的绝对值也越大；装备越好，人物天赋的收益也越高。</li>

</ul>

<hr>

<h2>🆕 近期更新摘要</h2>

<table>
<tr><td>模块</td><td>关键改动</td></tr>
<thead>

<tr><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>装备系统</strong></td><td>新增装备强化12级系统（每级1.2倍指数成长，+4/+8保护机制）、装备洗练系统、装备批量分解系统；装备评分公式改为 品质倍率 × 1.2^强化等级</td></tr>

<tr><td><strong>人物系统</strong></td><td>新增天赋值与努力值系统（详情页可见，影响基础属性），新增回炉重造升星系统（80级可升星，继承10%努力值为天赋值）</td></tr>

<tr><td><strong>丹方系统</strong></td><td>丹方通过通关对应地图第5重难度解锁，低等级地图对应低品丹方，高等级地图对应高品丹方</td></tr>

<tr><td><strong>宗门系统</strong></td><td>人物数据面板优化，显示前7项数据，超出部分可滚动；点击人物详情在该位置弹出弹窗</td></tr>

<tr><td><strong>背包·装备</strong></td><td>装备卡片显示分类标签（武器/法宝/防具/饰品）；修复仙缘祈福装备在背包不显示的问题</td></tr>

<tr><td><strong>灵宠系统</strong></td><td>放生仅返还精华和升星碎片；升星按钮合并碎片提示</td></tr>

<tr><td><strong>仪表盘</strong></td><td>移除胜率统计；新增幻灵结晶统计（显示本次探索增量）</td></tr>

<tr><td><strong>界面优化</strong></td><td>上品+装备获得弹窗移至挂机日志上方，5秒自动消失；ESC键关闭当前菜单</td></tr>

</tbody>

</table>

<hr>

<h2>1. 游戏核心循环</h2>

本作是一款 <strong>放置（idle）+ 数值成长</strong> 修仙游戏。核心循环如下：

<pre><code>
打坐修炼 / 自动修炼 → 积累修为至公共池 → 分配给角色升级突破

        ↓

   角色等级提升 → 解锁更高秘境 / 更高装备境界要求

        ↓

   抽卡招募角色 → 组建宗门队伍（最多 3 人出战）

        ↓

   挂机探索 / 抽卡 / 炼丹 → 获取装备 · 灵宠 · 素材 · 灵石

        ↓

   宗门成员共享装备与灵宠 → 装备 Build + 灵宠出战 + 套装加成 → 战力飙升

        ↓

   挂机队伍协同战斗 → 挑战更高秘境更高难度 → 更优掉落 → 反哺成长

</pre></code>

<strong>最重要的一条认知</strong>：等级本身<strong>不直接增加</strong>攻击/生命等战斗数值。真正让你变强的是 <strong>角色阵容、装备 Build、灵宠、套装、丹药永久加成、回炉重造</strong>。等级的作用是：

<ul>

<li>解锁可装备的装备「境界要求」(<code>requiredRealm</code>)；</li>

</ul>

<ul>

<li>作为 Build 匹配度判定外的另一条进度主线；</li>

</ul>

<ul>

<li>每级增加少量基础属性（攻击/生命/防御/速度），通过等级倍率放大战力。</li>

</ul>

<hr>

<h2>🧍 人物系统（40%战力 · 核心支柱一）</h2>

<blockquote><strong>人物系统是游戏两大核心支柱之一，约占总战力的40%。</strong>理解天赋值、努力值、回炉重造三大机制，是打造强力角色的关键。</blockquote>

<h3>2.1 角色星级与基础属性</h3>

角色分为三个星级，初始天赋值与成长率各不相同：

<table>
<tr><td>星级</td><td>初始天赋值</td><td>属性倍率</td><td>等级成长</td><td>努力值上限</td></tr>
<thead>

<tr><th>---</th><th>---:</th><th>---:</th><th>---:</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td><strong>三星 ★★★</strong></td><td>100</td><td>×1.0</td><td>×1.0</td><td>135（四星基础×0.9）</td></tr>

<tr><td><strong>四星 ★★★★</strong></td><td>150</td><td>×1.5</td><td>×1.2</td><td>202（五星基础×0.9）</td></tr>

<tr><td><strong>五星 ★★★★★</strong></td><td>225</td><td>×2.5</td><td>×1.5</td><td>无上限</td></tr>

</tbody>

</table>

<ul>

<li><strong>天赋值决定基础属性基准</strong>：天赋值越高，角色的攻击/生命/防御/速度基础值越高；</li>

</ul>

<ul>

<li><strong>等级成长倍率</strong>：每级属性成长量，三星×1、四星×1.2、五星×1.5；</li>

</ul>

<ul>

<li><strong>努力值上限</strong>：三/四星努力值有上限（下一星天赋值×0.9），五星无上限，可无限培养。</li>

</ul>

<h3>2.2 天赋值系统</h3>

<strong>天赋值（talentValue）</strong>是角色的天生潜力，决定基础属性的基准倍率：

<ul>

<li>三星初始天赋值：<strong>100</strong></li>

</ul>

<ul>

<li>四星初始天赋值：<strong>150</strong></li>

</ul>

<ul>

<li>五星初始天赋值：<strong>225</strong></li>

</ul>

<ul>

<li>天赋值可通过<strong>回炉重造</strong>升星永久提升；</li>

</ul>

<ul>

<li>基础属性倍率 = 天赋值 / 星级基础天赋值。</li>

</ul>

<blockquote>例：一个天赋值为180的四星角色，基础属性倍率 = 180/150 = <strong>1.2倍</strong></blockquote>

<h3>2.3 努力值系统</h3>

<strong>努力值（effortValue）</strong>是角色后天锻炼的成果，通过服用<strong>培元丹系列丹药</strong>提升：

<ul>

<li>属性加成公式：<strong>1 + 努力值 / 天赋值</strong>（额外倍率）；</li>

</ul>

<ul>

<li><strong>三星努力值上限</strong>：135（四星基础天赋值150 × 0.9）；</li>

</ul>

<ul>

<li><strong>四星努力值上限</strong>：202（五星基础天赋值225 × 0.9，向下取整）；</li>

</ul>

<ul>

<li><strong>五星努力值</strong>：无上限，可无限培养；</li>

</ul>

<ul>

<li>努力值越高，属性加成越大，但边际收益递减（因为分母是天赋值）。</li>

</ul>

<blockquote>例：天赋值150、努力值100的四星角色，努力值加成 = 1 + 100/150 = <strong>1.67倍</strong></blockquote>

<h3>2.4 角色属性总公式</h3>

角色最终有效基础属性由天赋值和努力值共同决定：

<pre><code>有效基础属性 = 模板基础属性 × (天赋值 / 星级基础天赋值) × (1 + 努力值 / 天赋值)

简化后：
有效基础属性 = 模板基础属性 × (天赋值 + 努力值) / 星级基础天赋值
</code></pre>

<ul>

<li>天赋值和努力值共同作用，两者相加决定最终属性强度；</li>

</ul>

<ul>

<li>提升天赋值（升星）既提升基准倍率，又提升努力值的作用效率；</li>

</ul>

<ul>

<li>提升努力值直接增加属性总量，但受限于当前星级的上限。</li>

</ul>

<h3>2.5 回炉重造（角色升星）</h3>

角色达到 <strong>80 级</strong> 后可在八卦炉→回炉转生进行升星（3★→4★→5★）：

<table>
<tr><td>项目</td><td>说明</td></tr>
<thead>

<tr><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>升星条件</strong></td><td>角色等级 ≥ 80级，当前星级 < 5星</td></tr>

<tr><td><strong>等级变化</strong></td><td>重置为1级，需重新修炼</td></tr>

<tr><td><strong>新天赋值</strong></td><td>下一星级基础天赋值 + 原努力值 × 10%</td></tr>

<tr><td><strong>努力值</strong></td><td>归零（但10%已转化为天赋值永久继承）</td></tr>

<tr><td><strong>基础属性</strong></td><td>按新天赋值重新计算（永久提升）</td></tr>

</tbody>

</table>

<ul>

<li><strong>核心价值</strong>：将临时的努力值转化为永久的天赋值，突破当前星级的上限；</li>

</ul>

<ul>

<li><strong>最优策略</strong>：在升星前尽量把努力值堆满，让10%的继承量最大化；</li>

</ul>

<ul>

<li><strong>后期意义</strong>：五星角色无努力值上限，是后期角色成长的终极形态。</li>

</ul>

<blockquote>例：三星角色努力值135（满值）升星到四星：新天赋值 = 150 + 135×10% = 150+13 = <strong>163</strong>（比初始四星的150还高13点）</blockquote>

<h3>2.6 角色定位（五大修仙定位）</h3>

每个角色拥有一个<strong>定位（role）</strong>，决定初始属性偏向和挂机战斗中的行动风格：

<table>
<tr><td>定位</td><td>修仙名</td><td>图标</td><td>对应传统定位</td><td>说明</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>vanguard</td><td><strong>先锋</strong></td><td>⚔️</td><td>主C</td><td>核心输出，攻击属性偏高</td></tr>

<tr><td>blade</td><td><strong>刀锋</strong></td><td>🗡️</td><td>附C</td><td>副位输出，速度/连击偏高</td></tr>

<tr><td>herb</td><td><strong>药引</strong></td><td>🌿</td><td>辅助</td><td>辅助治疗，生命/治疗偏高</td></tr>

<tr><td>shield</td><td><strong>护法</strong></td><td>🛡️</td><td>坦克</td><td>承伤坦克，防御/生命偏高</td></tr>

<tr><td>tactician</td><td><strong>掌阵</strong></td><td>📐</td><td>指挥官</td><td>战术核心，速度/增益偏高</td></tr>

</tbody>

</table>

<h3>2.7 天赋技能</h3>

每个角色拥有独特的<strong>天赋技能</strong>，提供永久属性加成或特殊效果：

<ul>

<li><strong>剑心通明</strong>：攻击+15%，暴击率+5%</li>

</ul>

<ul>

<li><strong>悟道天机</strong>：修炼效率+20%，灵力恢复+15%</li>

</ul>

<ul>

<li><strong>炎躯</strong>：攻击+12%，最终增伤+10%</li>

</ul>

<ul>

<li>每个角色的天赋技能各不相同，选择与Build搭配的天赋至关重要。</li>

</ul>

<h3>2.8 宗门与队伍编成</h3>

<ul>

<li>抽卡获得的角色会加入宗门，出战队伍最多 <strong>3 人</strong>；</li>

</ul>

<ul>

<li>队伍总战力 = 所有出战成员的战力之和，决定挂机匹配度；</li>

</ul>

<ul>

<li>宗门成员共享同一个背包，装备/灵宠可自由调配；</li>

</ul>

<ul>

<li>「一键自动穿戴」会从共享背包中为角色挑选当前最优装备。</li>

</ul>

<hr>

<h2>⚔️ 装备系统（60%战力 · 核心支柱二）</h2>

<blockquote><strong>装备系统是游戏两大核心支柱之一，约占总战力的60%。</strong>装备的品质、强化、词条、套装是提升战力的最主要途径。</blockquote>

<h3>3.1 装备品质（6档）</h3>

装备分为6个品质等级，品质越高基础属性越强、词条越多、评分倍率越高：

<table>
<tr><td>品质</td><td>名称</td><td>颜色</td><td>评分倍率</td><td>词条数上限</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---:</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>common</td><td>凡品</td><td>灰</td><td>×1</td><td>1</td></tr>

<tr><td>uncommon</td><td>良品</td><td>绿</td><td>×1.5</td><td>2</td></tr>

<tr><td>rare</td><td>上品</td><td>蓝</td><td>×2</td><td>3</td></tr>

<tr><td>epic</td><td>极品</td><td>紫</td><td>×3.5</td><td>4</td></tr>

<tr><td>legendary</td><td>仙品</td><td>金</td><td>×6</td><td>5</td></tr>

<tr><td>mythic</td><td>神品</td><td>红</td><td>×10</td><td>6</td></tr>

</tbody>

</table>

<ul>

<li>品质倍率直接乘以装备总分，是影响装备评分的关键因素；</li>

</ul>

<ul>

<li>高品质装备不仅基础分高，还能拥有更多词条，进一步拉大差距。</li>

</ul>

<h3>3.2 装备槽位（12 + 法宝）</h3>

<pre><code>
weapon 武器 / head 头部 / body 衣服 / legs 裤子 / feet 鞋子
shoulder 肩甲 / hands 手套 / wrist 护腕 / necklace 项链
ring1 戒指 / ring2 戒指 / belt 腰带    ← 共 12 槽，宗门成员可装备
artifact 法宝                            ← 仅高难 Boss / 抽卡产出
</code></pre>

<h3>3.3 装备评分公式</h3>

单件装备评分由基础分、词条分、套装分、品质倍率、强化倍率共同决定：

<pre><code>装备评分 = round( (基础分 + 词条分 + 套装分) × 品质倍率 × 1.2^强化等级 )</code></pre>

<ul>

<li><strong>基础分</strong>：装备自带的主属性（攻击/生命/防御/速度等）折算分数；</li>

</ul>

<ul>

<li><strong>词条分</strong>：所有附加词条的分数之和，按tier分级（tier1×1、tier2×1.5、tier3×2.5）；</li>

</ul>

<ul>

<li><strong>套装分</strong>：带套装id的装备固定+50分；</li>

</ul>

<ul>

<li><strong>品质倍率</strong>：凡品×1 → 神品×10；</li>

</ul>

<ul>

<li><strong>强化倍率</strong>：1.2的强化等级次方，指数成长。</li>

</ul>

<h3>3.4 装备强化系统</h3>

装备可强化最多 <strong>12 级</strong>，每级提升 <strong>1.2 倍</strong>属性（指数成长）：

<table>
<tr><td>强化等级</td><td>属性倍率</td><td>强化石类型</td><td>强化石数量</td></tr>
<thead>

<tr><th>---:</th><th>---:</th><th>---</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>+1</td><td>×1.2</td><td>普通强化石</td><td>5</td></tr>

<tr><td>+2</td><td>×1.44</td><td>普通强化石</td><td>10</td></tr>

<tr><td>+3</td><td>×1.73</td><td>普通强化石</td><td>20</td></tr>

<tr><td>+4</td><td>×2.07</td><td>普通强化石</td><td>40</td></tr>

<tr><td>+5</td><td>×2.49</td><td>高级强化石</td><td>5</td></tr>

<tr><td>+6</td><td>×2.99</td><td>高级强化石</td><td>10</td></tr>

<tr><td>+7</td><td>×3.58</td><td>高级强化石</td><td>20</td></tr>

<tr><td>+8</td><td>×4.30</td><td>高级强化石</td><td>40</td></tr>

<tr><td>+9</td><td>×5.16</td><td>至尊强化石</td><td>1</td></tr>

<tr><td>+10</td><td>×6.19</td><td>至尊强化石</td><td>2</td></tr>

<tr><td>+11</td><td>×7.43</td><td>至尊强化石</td><td>4</td></tr>

<tr><td>+12</td><td>×8.92</td><td>至尊强化石</td><td>8</td></tr>

</tbody>

</table>

<h4>锁定等级机制（失败回退）</h4>

<ul>

<li><strong>+4 保护</strong>：强化 +1~+4 失败归零；+5~+8 失败回到 +4；</li>

</ul>

<ul>

<li><strong>+8 保护</strong>：强化 +9~+12 失败回到 +8；</li>

</ul>

<ul>

<li>基础成功率 90%，随等级提升小幅下降（每级-3%）。</li>

</ul>

<h4>强化石获取途径</h4>

<ul>

<li><strong>普通强化石</strong>：所有地图挂机均可获得；</li>

</ul>

<ul>

<li><strong>高级强化石</strong>：龙渊（难度4）以上地图获得；</li>

</ul>

<ul>

<li><strong>至尊强化石</strong>：分解仙品以上装备概率获得，分解神品必出 1~3 个。</li>

</ul>

<h3>3.5 装备洗练系统</h3>

消耗<strong>洗练石</strong>重洗装备词条属性：

<ul>

<li>支持<strong>全词条洗练</strong>和<strong>单条洗练</strong>两种模式；</li>

</ul>

<ul>

<li>越稀有的装备越容易洗出稀有词条，数值也越高；</li>

</ul>

<ul>

<li>可用<strong>定灵丹</strong>获得保底（洗练不会降低属性）；</li>

</ul>

<ul>

<li>词条按 tier 分档：tier1×1、tier2×1.5、tier3×2.5。</li>

</ul>

<h3>3.6 装备分解系统</h3>

支持<strong>多选批量分解</strong>，一键处理多余装备：

<table>
<tr><td>品质</td><td>强化石</td><td>洗练石</td></tr>
<thead>

<tr><th>---</th><th>---:</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>凡品</td><td>1</td><td>0</td></tr>

<tr><td>良品</td><td>2</td><td>1</td></tr>

<tr><td>上品</td><td>3</td><td>2</td></tr>

<tr><td>极品</td><td>4</td><td>3</td></tr>

<tr><td>仙品</td><td>5</td><td>4</td></tr>

<tr><td>神品</td><td>6</td><td>5</td></tr>

</tbody>

</table>

<ul>

<li>仙品以上装备概率产出<strong>至尊强化石</strong>；</li>

</ul>

<ul>

<li>神品装备分解必得 1~3 个至尊强化石。</li>

</ul>

<h3>3.7 套装系统</h3>

集齐同套装多件触发额外Build加成分：

<table>
<tr><td>套装件数</td><td>Build 加成分</td></tr>
<thead>

<tr><th>---</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>2 件</td><td>+200</td></tr>

<tr><td>3 件</td><td>+300</td></tr>

<tr><td>4 件</td><td>+500</td></tr>

<tr><td>5 件</td><td>+800</td></tr>

</tbody>

</table>

游戏内置 10 套套装，覆盖攻、防、速、吸血、暴击、生命、修炼等方向：

<table>
<tr><td>套装</td><td>部位</td><td>2件效果</td><td>3件效果</td><td>4件效果</td><td>5件效果</td><td>特点</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>烈焰刃</strong></td><td>武器/手套/戒指1</td><td>攻击+10%</td><td>暴击伤害+20%</td><td>—</td><td>—</td><td>火系攻击，暴击输出</td></tr>

<tr><td><strong>玄铁卫</strong></td><td>头部/衣服/腰带/戒指2</td><td>防御+15%</td><td>生命+10%</td><td>最终减伤+10%</td><td>—</td><td>坦克防御，减伤核心</td></tr>

<tr><td><strong>疾风影</strong></td><td>鞋子/裤子/护腕</td><td>速度+15%</td><td>闪避率+10%</td><td>—</td><td>—</td><td>速度闪避，风筝打法</td></tr>

<tr><td><strong>血牙</strong></td><td>武器/护腕/戒指1/手套</td><td>吸血率+8%</td><td>连击率+10%</td><td>最终增伤+12%</td><td>—</td><td>吸血续航，持续战斗</td></tr>

<tr><td><strong>雷霆击</strong></td><td>武器/头部/手套/法宝</td><td>眩晕率+6%</td><td>暴击率+8%</td><td>暴击伤害+25%</td><td>—</td><td>眩晕暴击，一击制敌</td></tr>

<tr><td><strong>不灭体</strong></td><td>衣服/项链/腰带/头部</td><td>生命+20%</td><td>治疗效果+30%</td><td>最终减伤+15%</td><td>—</td><td>生命恢复，极致生存</td></tr>

<tr><td><strong>反击道</strong></td><td>肩甲/护腕/衣服/戒指2</td><td>反击率+10%</td><td>防御+12%</td><td>反击率再+10%</td><td>—</td><td>反击防御，后发制人</td></tr>

<tr><td><strong>灵气髓</strong></td><td>项链/头部/戒指2</td><td>灵力获取+20%</td><td>修炼效率+20%</td><td>—</td><td>—</td><td>修炼加速，道法自然</td></tr>

<tr><td><strong>战斗王</strong></td><td>武器/衣服/戒指1/戒指2/法宝</td><td>战斗属性+5%</td><td>战斗抗性+5%</td><td>最终增伤+15%</td><td>最终减伤+15%</td><td>全能战斗，攻防兼备</td></tr>

<tr><td><strong>道仙尊</strong></td><td>武器/头部/衣服/鞋子/法宝</td><td>攻击+10%</td><td>生命+15%</td><td>暴击率+10%</td><td>最终增伤+20%</td><td>传说套装，道法通天</td></tr>

</tbody>

</table>

<blockquote><strong>套装选择建议</strong>：输出优先烈焰刃/血牙，坦克玄铁卫/不灭体，速度流疾风影，万能战斗王/道仙尊。4~5件套效果远超散件。</blockquote>

<h3>3.8 装备总评分</h3>

<pre><code>装备总分 = Σ(每件已装备评分) + Σ(套装激活分)</code></pre>

<ul>

<li>挂机时，队伍总装备分按60%权重计入战力；</li>

</ul>

<ul>

<li>装备系统是提升战力效率最高的途径，优先投入资源。</li>

</ul>

<hr>

<h2>4. 战力计算详解</h2>

<blockquote>战力是角色综合实力的数值体现，由人物系统（40%）和装备系统（60%）加权计算，再乘以等级倍率。</blockquote>

<h3>4.1 战力总公式</h3>

<pre><code>角色战力 = (人物裸分 × 0.4 + 装备分 × 0.6) × 等级倍率</code></pre>

<h3>4.2 人物裸分构成（40%权重）</h3>

<pre><code>人物裸分 = 基础属性分 + 天赋技能分 + 灵宠分</code></pre>

<ul>

<li><strong>基础属性分</strong> = 攻击×5 + 生命×0.5 + 防御×3 + 速度×8（含天赋值和努力值加成）；</li>

</ul>

<ul>

<li><strong>天赋技能分</strong>：角色天赋技能提供的属性折算分数；</li>

</ul>

<ul>

<li><strong>灵宠分</strong>：出战灵宠的属性折算分数（取0.5系数）。</li>

</ul>

<h3>4.3 装备分构成（60%权重）</h3>

<pre><code>装备分 = 12件装备评分 + 套装激活分</code></pre>

<ul>

<li><strong>12件装备评分</strong>：每件装备的完整评分（含词条/品质/强化）；</li>

</ul>

<ul>

<li><strong>套装激活分</strong>：2件+200 / 3件+100 / 4件+200 / 5件+300。</li>

</ul>

<h3>4.4 等级倍率</h3>

<pre><code>等级倍率 = 1 + (等级-1) × 0.02</code></pre>

<ul>

<li>每升1级，战力额外+2%；</li>

</ul>

<ul>

<li>等级本身不直接增加基础属性，但通过倍率放大人和装备的总分。</li>

</ul>

<h3>4.5 队伍总战力</h3>

<blockquote>队伍总战力 = 所有出战成员的战力之和，这是挂机「推荐 Build 匹配度」的判定基准。</blockquote>

<hr>

<h2>5. 资源体系一览</h2>

<table>
<tr><td>资源</td><td>来源</td><td>用途</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>灵石</strong></td><td>挂机/探索/Boss/出售装备</td><td>强化消耗、兑换幻灵结晶、炼丹</td></tr>

<tr><td><strong>幻灵结晶</strong></td><td>挂机每场产出、灵石兑换（50:1）、新手福利</td><td><strong>抽卡专用货币</strong></td></tr>

<tr><td><strong>强化石</strong></td><td>分解装备（按品质 1~6 颗）</td><td>装备强化（1.2倍/级，指数成长）</td></tr>

<tr><td><strong>洗练石</strong></td><td>分解非凡品装备（凡品 0，其余 1~5 颗）</td><td>重洗装备词条</td></tr>

<tr><td><strong>灵宠精华</strong></td><td>分解灵宠、<strong>放生灵宠报恩</strong>、抽卡资源</td><td>灵宠升级</td></tr>

<tr><td><strong>灵魂碎片</strong></td><td><strong>抽到重复角色自动转换</strong></td><td>角色突破境界</td></tr>

<tr><td><strong>素材</strong>（灵草/矿料/灵液/妖核/奇遇）</td><td>挂机、抽卡、炼丹</td><td>炼制丹药</td></tr>

<tr><td><strong>修为</strong></td><td>打坐、自动修炼、挂机胜利、被动增长</td><td>角色升级和突破</td></tr>

</tbody>

</table>

<hr>

<h2>6. 修炼与突破：修为公共池与人物成长</h2>

<h3>6.1 修为公共池</h3>

获得修为后，修为<strong>进入公共池</strong>（<code>cultivationPool</code>），玩家可以自由分配给宗门中的任意角色。修为主要来源：

<ul>

<li>挂机胜利</li>

</ul>

<ul>

<li>打坐修炼 / 自动修炼</li>

</ul>

<ul>

<li>被动增长（每10秒）</li>

</ul>

<h3>6.2 修炼阶段划分</h3>

人物修为分为四个阶段，共 <strong>126 级</strong>：

<table>
<tr><td>阶段</td><td>境界范围</td><td>等级范围</td><td>特点</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>前期</strong></td><td>练气 ~ 金丹</td><td>1~27</td><td>基础成长，突破需求低</td></tr>

<tr><td><strong>中期</strong></td><td>元婴 ~ 化神</td><td>28~45</td><td>成长加速，需要灵石和素材</td></tr>

<tr><td><strong>后期</strong></td><td>返虚 ~ 大乘</td><td>46~72</td><td>高级成长，突破需BOSS专属素材</td></tr>

<tr><td><strong>终局</strong></td><td>渡劫 ~ 大罗</td><td>73~126</td><td>极限成长，突破代价极高</td></tr>

</tbody>

</table>

每个大境界包含9重（如练气一重~练气九重），每9级为一个大境界。

<h3>6.3 升级经验计算</h3>

每级所需经验按指数增长：

<pre><code>升级经验 = floor(100 × 1.15^(等级-1))</code></pre>

<h3>6.4 突破机制</h3>

当角色等级为9的倍数时（9、18、27...），升级需要进行<strong>境界突破</strong>。突破消耗：

<ul>

<li><strong>灵石</strong>：随等级和阶段倍率递增</li>

</ul>

<ul>

<li><strong>修为</strong>：升级经验的2倍（含阶段倍率）</li>

</ul>

<ul>

<li><strong>BOSS专属素材</strong>：每9级突破需要1个对应地图的BOSS素材</li>

</ul>

<pre><code>阶段倍率 = { 前期:1, 中期:3, 后期:10, 终局:30 }</code></pre>

<h3>6.5 每级基础数值提升</h3>

升级带来的基础属性增长：

<pre><code>攻击 += floor(2 × 1.08^(等级-1))
生命 += floor(15 × 1.08^(等级-1))
防御 += floor(1.5 × 1.08^(等级-1))
速度 += floor(0.5 × 1.08^(等级-1))</code></pre>

<h3>6.6 BOSS专属素材</h3>

每个地图有两个专属BOSS，击败后有概率掉落突破素材。需要选择<strong>凶险及以上难度</strong>才有概率遇到：

<table>
<tr><td>遇到概率</td><td>凶险</td><td>绝境</td><td>灭世</td></tr>
<thead>

<tr><th>---:</th><th>---:</th><th>---:</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>遭遇BOSS</td><td>50%</td><td>75%</td><td>90%</td></tr>

</tbody>

</table>

各地图BOSS素材：

<table>
<tr><td>等级</td><td>地图</td><td>素材1</td><td>素材2</td></tr>
<thead>

<tr><th>---:</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>9</td><td>青萝林</td><td>野猪獠牙</td><td>山匪令牌</td></tr>

<tr><td>18</td><td>迷雾谷</td><td>蛇鳞</td><td>灵狼皮毛</td></tr>

<tr><td>27</td><td>凤凰窟</td><td>凤凰羽毛</td><td>火焰核心</td></tr>

<tr><td>36</td><td>龙渊</td><td>龙鳞</td><td>龙元</td></tr>

<tr><td>45</td><td>鬼荒原</td><td>鬼气精华</td><td>骨器</td></tr>

<tr><td>54</td><td>冰玄殿</td><td>冰晶</td><td>冰封核心</td></tr>

<tr><td>63</td><td>仙陨墟</td><td>仙人碎片</td><td>神性精华</td></tr>

<tr><td>72</td><td>混沌境</td><td>混沌水晶</td><td>虚空精华</td></tr>

</tbody>

</table>

<hr>

<h2>7. 灵宠系统</h2>

灵宠出战后为人物提供<strong>全属性加成</strong>（攻击/防御/生命 + 一众战斗属性）。加成由「品质 × 星级 × 等级 × 阶位」综合决定：

<pre><code>
品质基础加成:  凡品3% / 灵品6% / 玄品9% / 仙品12% / 神品15%
每星加成:      各品质 1%~2%/星
每级加成:      (等级-1) × 基础加成 × 10%
每 5 星阶位:   阶位 × 基础加成 × 50%
最终加成 = 基础 + 星 + 等级 + 阶位（战斗属性取一半）
</code></pre>

<h3>7.1 灵宠操作</h3>

<ul>

<li><strong>升级</strong>：吃灵宠精华，按品质倍率提升战斗属性；</li>

</ul>

<ul>

<li><strong>升星</strong>：消耗同名同品质灵宠，星级 +1，并返还被吃灵宠已耗精华；</li>

</ul>

<ul>

<li><strong>装备到角色</strong>：在宗门页面为角色装备灵宠，加成实时叠加到最终属性；</li>

</ul>

<ul>

<li><strong>卸下灵宠</strong>：从角色卸下灵宠，归还共享背包；</li>

</ul>

<ul>

<li><strong>放生报恩</strong>：放生灵宠获得精华回报。</li>

</ul>

<h3>7.2 灵宠放生报恩</h3>

放生灵宠会根据其<strong>稀有度</strong>返还一定量的<strong>灵宠精华</strong>作为「报恩」：

<pre><code>返还精华 = 稀有度基础 + 等级×2 + 星级×5</code></pre>

<table>
<tr><td>灵宠品质</td><td>基础返还精华</td></tr>
<thead>

<tr><th>---</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>神品</td><td>100</td></tr>

<tr><td>仙品</td><td>60</td></tr>

<tr><td>玄品</td><td>35</td></tr>

<tr><td>灵品</td><td>20</td></tr>

<tr><td>凡品</td><td>10</td></tr>

</tbody>

</table>

<blockquote>放生后灵宠感恩离去，精华实时到账。养成高星高等级的灵宠放生回报更丰厚。</blockquote>

<hr>

<h2>8. 挂机探索系统</h2>

挂机是放置收益的核心。每 <strong>15 秒</strong> 一场遭遇，按地图掉落结算。

<h3>8.1 队伍协同战斗</h3>

<ul>

<li>挂机时按<strong>队伍总战力</strong>与地图推荐 Build 计算匹配度；</li>

</ul>

<ul>

<li>每个出战成员有<strong>独立气血条</strong>，气血耗尽则无法参战；</li>

</ul>

<ul>

<li>日志会<strong>逐一描写每个角色的战斗行动</strong>（按定位调用不同文案池）；</li>

</ul>

<ul>

<li><strong>全队力竭</strong>（所有成员气血归零）时挂机提前终止。</li>

</ul>

<h3>8.2 小剧场系统（idleBuffs）</h3>

挂机过程中会<strong>随机触发队伍小剧场</strong>，为本次挂机提供临时增益或减益 buff：

<ul>

<li>共 <strong>15 种小剧场</strong>，涵盖切磋、寻宝、内讧、感悟、中毒、灵泉等情境；</li>

</ul>

<ul>

<li>buff 类型包括：修炼、战斗、攻击、速度、气运；</li>

</ul>

<ul>

<li>buff 有<strong>持续场次</strong>，每场遭遇后递减，归零后失效；</li>

</ul>

<ul>

<li>部分为<strong>负向 buff</strong>（内讧、士气低落、受惊等），降低当次挂机效率。</li>

</ul>

<h3>8.3 挂机收益</h3>

每场遭遇还会<strong>额外产出幻灵结晶</strong>（抽卡专用货币），数量随秘境难度递增。

各秘境「凶险(标准)档」的掉落配置：

<table>
<tr><td>秘境</td><td>难度</td><td>奖励倍率</td><td>装备掉率</td><td>装备品质</td><td>灵宠掉率</td><td>灵宠品质</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---:</th><th>---:</th><th>---</th><th>---:</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>青萝林</td><td>1</td><td>×1.0</td><td>22%</td><td>良品</td><td>—</td><td>—</td></tr>

<tr><td>迷雾谷</td><td>2</td><td>×1.5</td><td>30%</td><td>良品/上品</td><td>—</td><td>—</td></tr>

<tr><td>凤凰窟</td><td>3</td><td>×2.0</td><td>36%</td><td>上品/极品</td><td>22%</td><td>灵品/玄品</td></tr>

<tr><td>龙渊</td><td>4</td><td>×3.0</td><td>42%</td><td>极品/仙品</td><td>30%</td><td>玄品/仙品</td></tr>

<tr><td>鬼荒原</td><td>5</td><td>×4.0</td><td>52%</td><td>仙品/神品</td><td>40%</td><td>仙品/神品</td></tr>

<tr><td>冰玄殿</td><td>6</td><td>×5.0</td><td>56%</td><td>神品</td><td>48%</td><td>神品</td></tr>

<tr><td>仙陨墟</td><td>7</td><td>×7.0</td><td>64%</td><td>神品</td><td>40%</td><td>神品</td></tr>

<tr><td>混沌境</td><td>8</td><td>×10.0</td><td>70%</td><td>神品</td><td>55%</td><td>神品</td></tr>

</tbody>

</table>

<h3>8.4 推荐 Build 与匹配度</h3>

<pre><code>推荐Build(某难度) = 基础Build × 难度缩放系数
匹配度 = 队伍总战力 ÷ 推荐Build</code></pre>

<ul>

<li>匹配度 ≥ 100%：稳定挂机，气血稳步回升；</li>

</ul>

<ul>

<li>匹配度 < 100%：按不足比例持续掉血，<strong>全队力竭即提前结束</strong>；</li>

</ul>

<ul>

<li>胜利额外回血，失败重创。</li>

</ul>

<h3>8.5 五档难度系数</h3>

<table>
<tr><td>难度</td><td>名称</td><td>缩放</td><td>奖励倍率</td><td>每场耗灵石</td><td>掉落加成系数</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---:</th><th>---:</th><th>---:</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>youli</td><td>游历</td><td>0.30</td><td>0.6</td><td>10</td><td>1.0</td></tr>

<tr><td>shilian</td><td>试炼</td><td>0.60</td><td>0.9</td><td>25</td><td>1.15</td></tr>

<tr><td>xiongxian</td><td>凶险</td><td>1.00</td><td>1.2</td><td>80</td><td>1.3</td></tr>

<tr><td>juejing</td><td>绝境</td><td>1.60</td><td>1.8</td><td>200</td><td>1.5</td></tr>

<tr><td>mieshi</td><td>灭世</td><td>2.50</td><td>2.8</td><td>500</td><td>1.8</td></tr>

</tbody>

</table>

<hr>

<h2>9. 八大秘境 × 五档难度 全数据表</h2>

各秘境凶险档推荐 Build 与分区推荐属性：

<table>
<tr><td>秘境</td><td>难度</td><td>推荐攻击</td><td>推荐生命</td><td>凶险推荐Build</td><td>游历</td><td>试炼</td><td>绝境</td><td>灭世</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---:</th><th>---:</th><th>---:</th><th>---:</th><th>---:</th><th>---:</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>青萝林</td><td>1</td><td>8</td><td>80</td><td>3,000</td><td>900</td><td>1,800</td><td>4,800</td><td>7,500</td></tr>

<tr><td>迷雾谷</td><td>2</td><td>25</td><td>200</td><td>12,000</td><td>3,600</td><td>7,200</td><td>19,200</td><td>30,000</td></tr>

<tr><td>凤凰窟</td><td>3</td><td>50</td><td>400</td><td>55,000</td><td>16,500</td><td>33,000</td><td>88,000</td><td>137,500</td></tr>

<tr><td>龙渊</td><td>4</td><td>100</td><td>800</td><td>100,000</td><td>30,000</td><td>60,000</td><td>160,000</td><td>250,000</td></tr>

<tr><td>鬼荒原</td><td>5</td><td>150</td><td>1,500</td><td>400,000</td><td>120,000</td><td>240,000</td><td>640,000</td><td>1,000,000</td></tr>

<tr><td>冰玄殿</td><td>6</td><td>300</td><td>3,000</td><td>800,000</td><td>240,000</td><td>480,000</td><td>1,280,000</td><td>2,000,000</td></tr>

<tr><td>仙陨墟</td><td>7</td><td>600</td><td>6,000</td><td>2,000,000</td><td>600,000</td><td>1,200,000</td><td>3,200,000</td><td>5,000,000</td></tr>

<tr><td>混沌境</td><td>8</td><td>1,000</td><td>10,000</td><td>7,000,000</td><td>2,100,000</td><td>4,200,000</td><td>11,200,000</td><td>17,500,000</td></tr>

</tbody>

</table>

<hr>

<h2>10. 仙缘祈福（抽卡）系统</h2>

<h3>10.1 祈福货币：幻灵结晶</h3>

抽卡使用<strong>幻灵结晶</strong>（非灵石）。获取途径：

<ul>

<li><strong>挂机产出</strong>：每场遭遇自动产出幻灵结晶，数量随秘境难度递增；</li>

</ul>

<ul>

<li><strong>灵石兑换</strong>：50 灵石 = 1 幻灵结晶，在抽卡页面可批量兑换；</li>

</ul>

<ul>

<li><strong>新手福利</strong>：新账号领取 20,000 幻灵结晶。</li>

</ul>

<h3>10.2 奖池总览</h3>

抽卡<strong>不一定 100% 抽到人物</strong>。人物概率 10%~25%，其余为灵石、装备、素材等。

<table>
<tr><td>奖池</td><td>单次消耗幻灵结晶</td><td>人物概率</td><td>装备概率</td><td>灵宠概率</td><td>资源概率</td></tr>
<thead>

<tr><th>---</th><th>---:</th><th>---:</th><th>---:</th><th>---:</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>综合池</td><td>100</td><td><strong>15%</strong></td><td>45%</td><td>15%</td><td>25%</td></tr>

<tr><td>人物池</td><td>150</td><td><strong>25%</strong></td><td>45%</td><td>10%</td><td>20%</td></tr>

<tr><td>装备池</td><td>120</td><td>0%</td><td>95%</td><td>0%</td><td>5%</td></tr>

<tr><td>武器池</td><td>120</td><td>0%</td><td>80%</td><td>0%</td><td>5%（含法宝15%）</td></tr>

<tr><td>法宝池</td><td>180</td><td>0%</td><td>10%</td><td>0%</td><td>5%（法宝85%）</td></tr>

<tr><td>灵宠池</td><td>200</td><td>0%</td><td>0%</td><td>95%</td><td>5%</td></tr>

</tbody>

</table>

<h3>10.3 角色星级概率</h3>

<pre><code>5星 = 1%    4星 = 19%    3星 = 80%</code></pre>

<h3>10.4 保底机制</h3>

<ul>

<li><strong>人物池 / 综合池</strong>：每 <strong>5 次</strong>抽卡保底一次 <strong>4★ 或以上</strong>角色；</li>

</ul>

<ul>

<li>若 5 次内未出现 4★+，第 5 次自动替换为 4★ 角色。</li>

</ul>

<h3>10.5 装备品质权重</h3>

凡品 40% / 良品 30% / 上品 18% / 极品 8% / 仙品 3% / 神品 1%。

<h3>10.6 灵宠品质权重</h3>

凡品 50% / 灵品 25% / 玄品 15% / 仙品 8% / 神品 2%。

<h3>10.7 重复角色处理</h3>

抽到已有的角色会<strong>自动转换为灵魂碎片</strong>（用于角色突破境界）：

<pre><code>灵魂碎片 = star × 10 + (star >= 4 ? 20 : 0)
3★ → 30 碎片    4★ → 60 碎片    5★ → 70 碎片</code></pre>

<hr>

<h2>11. 丹药炼制系统</h2>

<h3>11.1 丹方获取与地图对应</h3>

<blockquote><strong>丹方通过通关对应地图第5重（灭世）难度解锁</strong>，低等级地图对应低品丹方，高等级地图对应高品丹方。</blockquote>

<table>
<tr><td>地图</td><td>难度</td><td>丹药品阶</td><td>解锁丹方</td></tr>
<thead>

<tr><th>---</th><th>---:</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>青萝林</strong></td><td>1</td><td>一品</td><td>聚灵丹、洗髓丹、疗伤丹、小培元丹</td></tr>

<tr><td><strong>迷雾谷</strong></td><td>2</td><td>二品</td><td>聚气丹、回灵丹、锻骨丹、解厄丹、悟道丹、培元丹</td></tr>

<tr><td><strong>凤凰窟</strong></td><td>3</td><td>三品</td><td>雷灵丹、凝元丹、清心丹、寻宝丹、淬灵丹、定灵丹、大培元丹</td></tr>

<tr><td><strong>龙渊</strong></td><td>4</td><td>四品</td><td>仙灵丹、火元丹、渡厄丹、极培元丹</td></tr>

<tr><td><strong>鬼荒原</strong></td><td>5</td><td>五品</td><td>五行丹、天培元丹</td></tr>

<tr><td><strong>冰玄殿</strong></td><td>6</td><td>六品</td><td>天元丹</td></tr>

<tr><td><strong>仙陨墟</strong></td><td>7</td><td>七品</td><td>日月丹</td></tr>

<tr><td><strong>混沌境</strong></td><td>8</td><td>八品</td><td>涅槃丹</td></tr>

</tbody>

</table>

<ul>

<li>地图详情页底部可查看该地图能解锁的丹方列表；</li>

</ul>

<ul>

<li>通关灭世难度后自动解锁对应丹方，在八卦炉→炼丹中可炼制。</li>

</ul>

<h3>11.2 培元丹系列（努力值核心）</h3>

培元丹系列是提升角色努力值的唯一途径，是人物系统成长的关键资源：

<table>
<tr><td>丹药</td><td>品阶</td><td>效果</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>小培元丹</td><td>一品</td><td>提升少量努力值</td></tr>

<tr><td>培元丹</td><td>二品</td><td>提升中量努力值</td></tr>

<tr><td>大培元丹</td><td>三品</td><td>提升大量努力值</td></tr>

<tr><td>极培元丹</td><td>四品</td><td>提升极多努力值</td></tr>

<tr><td>天培元丹</td><td>五品</td><td>提升海量努力值</td></tr>

</tbody>

</table>

<h3>11.3 关键丹药一览</h3>

<table>
<tr><td>丹药</td><td>功能</td><td>效果</td></tr>
<thead>

<tr><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>洗髓丹</td><td>永久属性</td><td>永久 +5 攻击（存档沉淀）</td></tr>

<tr><td>锻骨丹</td><td>永久属性</td><td>永久 +6 防御</td></tr>

<tr><td>疗伤丹</td><td>战斗</td><td>战斗中回血 30%</td></tr>

<tr><td>解厄丹</td><td>战斗</td><td>清除负面状态</td></tr>

<tr><td>悟道丹</td><td>探索</td><td>修为获取 +20%（限时）</td></tr>

<tr><td>寻宝丹</td><td>探索</td><td>掉落 +20%（限时）</td></tr>

<tr><td>淬灵丹</td><td>强化</td><td>下次强化成功率 +15%</td></tr>

<tr><td>定灵丹</td><td>洗练</td><td>洗练保底 1 次不降属性</td></tr>

<tr><td>渡厄丹</td><td>突破</td><td>突破成功率 +10%</td></tr>

</tbody>

</table>

<blockquote>永久类（洗髓/锻骨）直接把数值写进基础属性并随存档沉淀，转生也保留。</blockquote>

<hr>

<h2>12. 战斗系统公式</h2>

战斗为<strong>回合制</strong>（最多 10 回合，超时判负），按速度决定先手。伤害结算顺序：

<pre><code>
1) 基础伤害 = 攻击 × (1 + 战斗属性提升 combatBoost)

2) 暴击：最终暴击率 = 攻方暴击率×(1+combatBoost) − 守方抗暴×(1+抗性提升)
         触发 → 伤害 ×= (1.5 + 暴伤强化)

3) 连击：触发 → 伤害 ×= 1.3

4) 吸血：触发 → 回血 = 造成伤害 × 30%

5) 眩晕：触发 → 守方本回合无法反击

6) 最终增伤：伤害 ×= (1 + 最终增伤)

7) 防御减伤：伤害 ×= 100 / (100 + 有效防御)，有效防御 = 防御×(1+combatBoost)

8) 若本次为暴击 → 再 ×= (1 − 暴伤减免)

9) 最终减伤：伤害 ×= (1 − 最终减伤)
</code></pre>

<ul>

<li><strong>闪避</strong>：实际闪避率 = 守方闪避率 − 攻方抗闪避；</li>

</ul>

<ul>

<li><strong>反击</strong>：守方反击率 − 攻方抗反击；</li>

</ul>

<ul>

<li><strong>先手</strong>：速度高者先攻。</li>

</ul>

<blockquote>实战要点：<strong>最终增伤/减伤、暴伤、吸血、连击</strong> 是后期碾压的核心。</blockquote>

<hr>

<h2>13. 进阶策略与成长路线</h2>

<h3>前期（练气 ~ 金丹，1~27 级）</h3>

<ul>

<li>主线：手动/自动打坐把修为堆上去，靠突破提升修炼效率；</li>

</ul>

<ul>

<li>资源：低难挂机（青萝林/迷雾谷 游历~试炼）攒灵石、灵草、幻灵结晶；</li>

</ul>

<ul>

<li>宗门：用综合池/人物池抽角色组队，3 人满编；新手福利 20,000 幻灵结晶开局抽卡；</li>

</ul>

<ul>

<li>炼丹：优先 <strong>聚灵丹、聚气丹、洗髓/锻骨丹（永久属性）</strong>；</li>

</ul>

<ul>

<li>装备：抽卡综合池拿第一套良品/上品，凑 2 件套即可。</li>

</ul>

<h3>中期（元婴 ~ 化神，28~45 级）</h3>

<ul>

<li>目标：队伍总战力冲到 <strong>入门(6.8万)~强力(68.6万)</strong>；</li>

</ul>

<ul>

<li>装备：进凤凰窟/龙渊 凶险~绝境，挂机出极品/仙品；集齐 1~2 套 4 件套；</li>

</ul>

<ul>

<li>灵宠：玄品/仙品出战，开始升级+升星；多余灵宠<strong>放生报恩</strong>换精华；</li>

</ul>

<ul>

<li>丹药：悟道丹+寻宝丹叠加，挂机收益最大化；</li>

</ul>

<ul>

<li>人物：开始吃培元丹堆努力值，准备80级回炉重造升星。</li>

</ul>

<h3>后期（返虚 ~ 大乘，46~72 级）</h3>

<ul>

<li>目标：战力冲 <strong>顶级(509万)</strong>，挑战鬼荒原/冰玄殿 绝境~灭世；</li>

</ul>

<ul>

<li>装备：神品为主，法宝优先补位；强化 +8 以上；洗练极品词条；</li>

</ul>

<ul>

<li>人物：完成首轮回炉重造，主力角色升到四星甚至五星；</li>

</ul>

<ul>

<li>灵宠：仙品/神品满星，精华集中养 1~2 只核心；</li>

</ul>

<ul>

<li>努力值：五星角色无上限，持续用天培元丹堆。</li>

</ul>

<h3>终局（渡劫 ~ 大罗，73~126 级）</h3>

<ul>

<li>目标：战力逼近 <strong>极限(2000万)</strong>，混沌界 灭世稳定挂机；</li>

</ul>

<ul>

<li>全神品双五件套、法宝满配、神品满星灵宠；</li>

</ul>

<ul>

<li>五星角色努力值无限堆叠，追求极致属性；</li>

</ul>

<ul>

<li>利用被动修为与离线结算，放置即可持续逼近大罗九重。</li>

</ul>

<h3>通用技巧</h3>

<ol>

<li><strong>装备优先（60%权重）</strong>：资源有限时优先投入装备系统，品质>强化>词条>套装；</li>

</ol>

<ol>

<li><strong>人物打底（40%权重）</strong>：好的角色是基础，天赋值越高装备收益越大；</li>

</ol>

<ol>

<li><strong>回炉重造要趁早</strong>：先升星再堆努力值，五星无上限才是终极追求；</li>

</ol>

<ol>

<li><strong>套装 > 散件</strong>：4~5 件套的 Build 分与百分比加成远超单件；</li>

</ol>

<ol>

<li><strong>幻灵结晶管理</strong>：挂机是幻灵结晶的主要来源，尽量保持挂机不断；灵石充足时可兑换应急；</li>

</ol>

<ol>

<li><strong>小剧场 buff</strong>：挂机时留意小剧场触发，正向 buff 可显著提升效率；</li>

</ol>

<ol>

<li><strong>永久丹药早吃早享受</strong>，转生不丢；</li>

</ol>

<ol>

<li><strong>匹配度 < 100% 别硬挂</strong>：会力竭提前结束，先把战力或难度降一档。</li>

</ol>

<hr>

<h2>14. 数据附录：关键公式汇总</h2>

<pre><code>
// —— 战力公式（核心） ——

角色战力     = (人物裸分 × 0.4 + 装备分 × 0.6) × 等级倍率
人物裸分     = 基础属性分 + 天赋技能分 + 灵宠分
装备分       = 12件装备评分 + 套装激活分
等级倍率     = 1 + (等级-1) × 0.02


// —— 人物属性 ——

有效基础属性 = 模板属性 × (天赋值/星级基础天赋) × (1 + 努力值/天赋值)
             = 模板属性 × (天赋值 + 努力值) / 星级基础天赋
三星天赋值   = 100    四星天赋值 = 150    五星天赋值 = 225
三星努力上限 = 135    四星努力上限 = 202  五星努力上限 = 无上限
回炉新天赋   = 下一星基础天赋 + 原努力值 × 10%


// —— 修为公共池 ——

修为获取     = 挂机胜利 + 打坐修炼 + 被动增长
升级经验     = floor(100 × 1.15^(等级-1))
阶段倍率     = { 前期:1, 中期:3, 后期:10, 终局:30 }


// —— 装备评分 ——

装备评分 = round((基础分 + 词条分 + 套装分) × 品质倍率 × 1.2^强化等级)
品质倍率   = 凡品1 / 良品1.5 / 上品2 / 极品3.5 / 仙品6 / 神品10
强化倍率   = 1.2^n（指数成长）
词条tier倍 = tier1×1 / tier2×1.5 / tier3×2.5
套装激活分 = 2件+200 / 3件+300 / 4件+500 / 5件+800


// —— 强化系统 ——

强化等级     = 最高12级
锁定等级     = +4 / +8（失败回退机制）
强化石类型   = 普通（全地图）/ 高级（龙渊4+）/ 至尊（分解仙品+）


// —— 挂机 ——

推荐Build(难度) = ZONE_BUILD_BASE × 难度缩放(0.3/0.6/1.0/1.6/2.5)
匹配度         = 队伍总战力 ÷ 推荐Build


// —— 抽卡 ——

抽卡货币     = 幻灵结晶（非灵石）
角色概率     = 综合池15% / 人物池25%
角色星级     = 5星1% / 4星19% / 3星80%
保底         = 人物池/综合池 每5次保底4★+
重复角色转化 = star × 10 + (star >= 4 ? 20 : 0)


// —— 战斗 ——

伤害 = 攻击×(1+combatBoost) ×[暴击1.5+暴伤] ×[连击1.3] ×(1+最终增伤)
     × 100/(100+防御×(1+combatBoost)) ×(1−暴伤减免,若暴击) ×(1−最终减伤)
闪避 = 守方闪避 − 攻方抗闪避；  反击 = 守方反击 − 攻方抗反击
</code></pre>

<hr>

<blockquote>📌 本手册数据均取自当前版本源码。版本更新后数值可能调整，请以游戏内实际表现为准。祝洞天早登大罗！</blockquote>`
