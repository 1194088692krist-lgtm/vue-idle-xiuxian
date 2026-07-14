export const guideHtml = `<h1>《修仙挂机录》完整攻略手册</h1>

<strong>当前版本：v1.2.0 · 洞天万象（2026-07-14）</strong>

<blockquote>一份基于游戏真实代码与数值的详尽攻略，覆盖宗门体系、角色定位、资源体系、修炼突破、装备 Build、灵宠、挂机探索（含小剧场）、分区难度、抽卡、丹药、战斗公式与进阶策略。</blockquote>



<hr>

<h2>🆕 近期（最近 2 天）海量更新摘要</h2>

<tr><td>模块</td><td>关键改动</td></tr>

<thead>

<tr><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>人物系统</strong></td><td>移除详情页突破数字和手动突破按钮；50 名角色描述全面重写，从同质化的"自幼/行走江湖/最终"改为各有特色的事件描述</td></tr>

<tr><td><strong>性别比例</strong></td><td>三星/四星/五星角色调整为 70% 女性（35/50），名称、小传、背景设定同步更新</td></tr>

<tr><td><strong>仙缘祈福</strong></td><td>五星角色获取概率从 3% 下调至 1%；每轮 9 连最多获得 2 个人物；4 星概率调整为 19%</td></tr>

<tr><td><strong>背包·素材</strong></td><td>新增多选卖出功能，可选择卖出个数后批量卖出</td></tr>

<tr><td><strong>背包·装备</strong></td><td>装备卡片显示分类标签（武器/法宝/防具/饰品）；修复仙缘祈福装备在背包不显示的问题</td></tr>

<tr><td><strong>灵宠系统</strong></td><td>放生仅返还精华和升星碎片（不再返还无意义的素材）；升星按钮合并碎片提示</td></tr>

<tr><td><strong>宗门系统</strong></td><td>人物数据面板限高，显示前 7 项数据，超出部分可滚动；点击人物详情在该位置弹出弹窗</td></tr>

<tr><td><strong>仪表盘</strong></td><td>移除胜率统计；在灵石统计后新增幻灵结晶统计（显示本次探索增量）；挂机过程不同角色定位起不同作用（加血、buff 等）</td></tr>

<tr><td><strong>装备系统</strong></td><td>挂机结算界面显示装备评分，点击可查看详情；修复仪表盘最近获得装备列表数据渲染和评分错误</td></tr>

<tr><td><strong>界面优化</strong></td><td>上品+装备获得弹窗移至挂机日志上方，5 秒自动消失；ESC 键关闭当前菜单；稀有宝物弹出框增加关闭按钮</td></tr>

<tr><td><strong>版本系统</strong></td><td>新增版本号系统（v1.2.0·洞天万象），在首页、README、攻略中同步显示</td></tr>

<tr><td><strong>攻略更新</strong></td><td>删除过时的"修炼与突破"章节；全面更新宗门信息和人物相关内容</td></tr>

<tr><td><strong>GMTOOLS</strong></td><td>后端代理上传同步素材功能，GitHub PAT 永远不下发到浏览器</td></tr>

<tr><td><strong>灵力系统</strong></td><td>界面最上方灵力改为幻灵结晶，移除灵力相关内容</td></tr>

<tr><td><strong>立绘查看</strong></td><td>人物详情页点击头像可观看立绘大图，头像旁有小字提示</td></tr>

<tr><td><strong>修为系统</strong></td><td>修为进入公共池，可分配给任意人物；分为前期(练气~金丹1-27级)、中期(元婴~化神28-45级)、后期(返虚~大乘46-72级)、终局(渡劫~大罗73-126级)</td></tr>

<tr><td><strong>BOSS系统</strong></td><td>每个地图新增两个专属BOSS，凶险50%、绝境75%、灭世90%概率遇到，掉落专属素材(10%~20%)</td></tr>

<tr><td><strong>难度调整</strong></td><td>高难度场灵石消耗增加（游历10、试炼25、凶险80、绝境200、灭世500）</td></tr>

<tr><td><strong>天赋增益</strong></td><td>确认并修复角色天赋和定位增益实装到角色基础数据</td></tr>

<tr><td><strong>洞天字号</strong></td><td>道号改为洞天字号，移除最上方境界显示（如"金丹四重"）</td></tr>

<tr><td><strong>响应式设计</strong></td><td>移动端保留现有逻辑，桌面端(≥1024px)采用横屏布局，左侧固定导航栏</td></tr>

<tr><td><strong>属性面板优化</strong></td><td>基础/战斗/特殊属性三表合一，最多显示7条，增加灵宠加成，百分比属性显示%</td></tr>

<tr><td><strong>装备详情修复</strong></td><td>探索结算栏装备点击查看详情修复，弹出装备详情页</td></tr>

<tr><td><strong>详情弹窗</strong></td><td>宗门人物详情弹窗靠下显示，不再居中</td></tr>

<tr><td><strong>战斗日志增强</strong></td><td>实时战斗日志体现武器、法宝、天赋技能效果</td></tr>

<tr><td><strong>天赋技能build</strong></td><td>天赋技能合理加入个体build强度计算</td></tr>

<tr><td><strong>自动保存槽</strong></td><td>新增自动保存槽位设计，避免误覆盖存档</td></tr>

<tr><td><strong>宗门标题</strong></td><td>宗门菜单显示洞天字号，如"宗门【无极岛】"</td></tr>

<tr><td><strong>幻灵结晶修复</strong></td><td>修复仪表盘幻灵结晶+NaN错误</td></tr>

<tr><td><strong>战斗平衡修复</strong></td><td>修复build不足时人物丝血不掉的不均衡问题</td></tr>

<tr><td><strong>顶部布局修复</strong></td><td>修复界面最上方文字叠加显示不全问题</td></tr>

<hr>

<hr>

<h2>1. 游戏核心循环</h2>

本作是一款 <strong>放置（idle）+ 数值成长</strong> 修仙游戏。核心循环如下：

<pre><code>

打坐修炼 / 自动修炼 → 积累修为至公共池 → 分配给角色升级突破

        ↓

   角色"修炼层数"(等级)提升 → 解锁更高秘境 / 更高装备境界要求

        ↓

   抽卡招募角色 → 组建宗门队伍（最多 5 人出战）

        ↓

   挂机探索 / 抽卡 / 炼丹 → 获取装备 · 灵宠 · 素材 · 灵石

        ↓

   宗门成员共享装备与灵宠 → 装备 Build + 灵宠出战 + 套装加成 → 战力飙升

        ↓

   挂机队伍协同战斗 + 小剧场增益 → 挑战更高秘境更高难度 → 更优掉落 → 反哺成长

</code></pre>

<strong>最重要的一条认知</strong>：等级（修炼层数）本身<strong>不直接增加</strong>攻击/生命等战斗数值。真正让你变强的是 <strong>角色阵容、装备 Build、灵宠、套装、丹药永久加成、转生</strong>。等级的作用是：

<ul>

<li>解锁可装备的装备「境界要求」(<code>requiredRealm</code>)；</li>

</ul>

<ul>

<li>作为 Build 匹配度判定外的另一条进度主线；</li>

</ul>

<ul>

<li>每级增加少量基础属性（攻击/生命/防御/速度）。</li>

</ul>

<hr>

<h2>2. 宗门系统：队伍与角色管理</h2>

<blockquote><strong>重要</strong>：原「人物」系统已完全被「宗门」取代。底部导航「宗门」即原「人物」页面（<code>Cultivation.vue</code>），所有角色管理、属性查看、装备穿戴、灵宠装备均在此处完成。</blockquote>

<h3>2.1 宗门成员</h3>

<ul>

<li>抽卡获得的角色会加入宗门，<strong>宗门上限人数</strong> 由 <code>maxSectSize</code> 控制；</li>

</ul>

<ul>

<li>出战队伍最多 <strong>5 人</strong>，从宗门成员中编队；挂机时按队伍总 Build 强度结算战斗；</li>

</ul>

<ul>

<li><strong>重复角色自动转换</strong>：抽到已有的角色会自动转为「人精华」（3★=30、4★=60、5★=70），用于角色突破境界。</li>

</ul>

  \`\`<code>

  essenceAmount = star × 10 + (star >= 4 ? 20 : 0)

  </code>\`<code>

<h3>2.2 宗门成员管理界面</h3>

在「宗门」页面可以：

<ul>

<li><strong>下拉选择</strong>查看任一已加入队伍的角色（避免一次展示过多）；</li>

</ul>

<ul>

<li><strong>三段式属性面板</strong>：显示基础/加成/最终三列，涵盖：</li>

</ul>

  - 主属性（攻击/生命/防御/速度）

  - 战斗属性（暴击率/连击率/反击率/眩晕率/闪避率/吸血率）

  - 特殊属性（抗暴击/抗连击/抗反击/抗眩晕/抗闪避/抗吸血/治疗强化/暴伤强化/暴伤减免/最终增伤/最终减伤/战意/抗性）

<ul>

<li><strong>装备系统</strong>：12 个装备槽位（武器/头部/衣服/裤子/鞋子/肩甲/手套/护腕/项链/戒指×2/腰带），手动穿脱或<strong>一键自动穿戴</strong>最优装备；</li>

</ul>

<ul>

<li><strong>灵宠系统</strong>：每个角色可装备 1 只灵宠，加成实时叠加到最终属性；<strong>灵宠统一在宗门菜单管理</strong>，背包仅可查看详情；</li>

</ul>

<ul>

<li><strong>一键卸装</strong>：快速卸下该角色所有装备与灵宠（归还共享背包）；</li>

</ul>

<ul>

<li>查看未出战的<strong>候补成员</strong>列表。</li>

</ul>

<h3>2.3 角色 Build 强度计算</h3>

单个角色的 Build 强度 = 基础属性分 + 装备评分 + 灵宠分 + 套装激活分，再乘以等级倍率：

<pre><code>

角色Build = (基础属性分 + Σ装备评分 + 灵宠分 + 套装激活分) × (1 + (等级-1)×0.02)

</code></pre>

<ul>

<li>基础属性分 = 攻击×5 + 生命×0.5 + 防御×3 + 速度×8（含天赋加成）</li>

</ul>

<ul>

<li>装备评分 = 每件装备的完整 Build 评分（含词条/品质/强化）</li>

</ul>

<ul>

<li>灵宠分 = 灵宠攻击×5 + 生命×0.5 + 防御×3 + 速度×8</li>

</ul>

<ul>

<li>套装激活分 = 2件+200 / 3件+100 / 4件+200 / 5件+300</li>

</ul>

<blockquote>队伍总 Build = 所有出战成员的 Build 之和，这是挂机匹配度的判定基准。</blockquote>

<h3>2.4 共享背包</h3>

宗门所有成员<strong>共享同一个背包</strong>：

<ul>

<li>装备、灵宠在背包中统一管理；</li>

</ul>

<ul>

<li>给某角色装备的物品会从背包移出，卸下后归还背包；</li>

</ul>

<ul>

<li>「一键自动穿戴」会从共享背包中为该角色挑选当前最优装备。</li>

</ul>

<hr>

<h2>3. 角色定位系统（五大修仙定位）</h2>

每个角色拥有一个<strong>定位（role）</strong>，影响挂机战斗中的行动描写与小剧场表现。定位名称采用修仙风命名，但可直观对应传统 RPG 角色：

<tr><td>定位</td><td>修仙名</td><td>图标</td><td>对应传统定位</td><td>说明</td></tr>

<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>vanguard</td><td><strong>先锋</strong></td><td>⚔️</td><td>主C</td><td>核心输出，队伍的主要战力担当</td></tr>

<tr><td>blade</td><td><strong>刀锋</strong></td><td>🗡️</td><td>附C</td><td>副位输出，补充伤害与连击</td></tr>

<tr><td>herb</td><td><strong>药引</strong></td><td>🌿</td><td>辅助</td><td>辅助治疗，为队伍提供续航</td></tr>

<tr><td>shield</td><td><strong>护法</strong></td><td>🛡️</td><td>坦克</td><td>承伤坦克，保护队友免受致命打击</td></tr>

<tr><td>tactician</td><td><strong>掌阵</strong></td><td>📐</td><td>指挥官</td><td>战术核心，掌控全局节奏与阵法</td></tr>

<h3>3.1 角色命名规则</h3>

角色名按星级分风格：

<ul>

<li><strong>3★</strong>：武侠风命名（墨风、青石、烈无涯、冷月、惊鸿……）；</li>

</ul>

<ul>

<li><strong>4★</strong>：过渡风格，半武侠半仙侠（凌霜剑姬、玄机子、赤焰灵尊……）；</li>

</ul>

<ul>

<li><strong>5★</strong>：仙侠风命名（太虚剑帝、混元道祖、九阳焚天真君、万古冰帝……）。</li>

</ul>

<h3>3.2 挂机中的角色行动</h3>

挂机日志会<strong>逐一描写每个队伍成员</strong>的战斗行动（而非单纯的「你XXX」），按定位调用不同文案池：

<pre><code>

先锋：挺身而出，以凌厉攻势直取敌人要害……

刀锋：身影如鬼魅般闪烁，快剑连斩三道……

药引：退后一步，指尖凝出碧绿灵光，为队友恢复气血……

护法：横身挡在队伍前方，护体真气化作金钟罩……

掌阵：在后方掐指推算，指点道：「左翼包抄，中军压上！」……

</code></pre>

<blockquote>气血耗尽的角色会显示「气血耗尽，无法参战……」并跳过行动。</blockquote>

<hr>

<h2>4. 资源体系一览</h2>

<tr><td>资源</td><td>来源</td><td>用途</td></tr>

<thead>

<tr><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>灵力</strong></td><td>随时间恢复（2 小时回满上限）、突破奖励</td><td>打坐修炼的消耗</td></tr>

<tr><td><strong>灵石</strong></td><td>挂机/探索/Boss/出售装备</td><td>购买、强化消耗、兑换幻灵结晶</td></tr>

<tr><td><strong>幻灵结晶</strong></td><td>挂机每场产出、灵石兑换（50:1）、新手福利</td><td><strong>抽卡专用货币</strong></td></tr>

<tr><td><strong>强化石</strong></td><td>分解装备（按品质 1~6 颗）</td><td>装备强化（+10% 评分/级）</td></tr>

<tr><td><strong>洗练石</strong></td><td>分解非凡品装备（凡品 0，其余 1~5 颗）</td><td>重洗装备词条</td></tr>

<tr><td><strong>灵宠精华</strong></td><td>分解灵宠、<strong>放生灵宠报恩</strong>、抽卡资源</td><td>灵宠升级</td></tr>

<tr><td><strong>人精华</strong></td><td><strong>抽到重复角色自动转换</strong></td><td>角色突破境界</td></tr>

<tr><td><strong>素材</strong>（灵草/矿料/灵液/妖核/奇遇）</td><td>挂机、抽卡、炼丹</td><td>炼制丹药</td></tr>

<tr><td><strong>修为</strong></td><td>打坐、自动修炼、挂机胜利、被动增长</td><td>突破境界的进度条</td></tr>

<strong>灵力恢复</strong>：</code>regenerateSpirit()<code> 每帧按 </code>maxSpirit / 7,200,000 ms × spiritRate<code> 回充，约 <strong>2 小时回满一次上限</strong>；突破时 </code>spiritRate *= 1.2<code> 复利，越后期回得越快。

<strong>装备分解产出</strong>（</code>QUALITY_STONE_MAP<code>）：

<tr><td>品质</td><td>强化石</td><td>洗练石</td></tr>

<thead>

<tr><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>凡品 common</td><td>1</td><td>0</td></tr>

<tr><td>良品 uncommon</td><td>2</td><td>1</td></tr>

<tr><td>上品 rare</td><td>3</td><td>2</td></tr>

<tr><td>极品 epic</td><td>4</td><td>3</td></tr>

<tr><td>仙品 legendary</td><td>5</td><td>4</td></tr>

<tr><td>神品 mythic</td><td>6</td><td>5</td></tr>

<hr>

<h2>5. 修炼与突破：修为公共池与人物成长</h2>

这是本手册最关键的一节，直接回答「修为如何分配？人物如何成长？有哪些数据上面的成长」。

<h3>5.1 修为公共池</h3>

获得修为后，修为<strong>进入公共池</strong>（</code>cultivationPool<code>），玩家可以自由分配给宗门中的任意角色。修为主要来源：

<ul>

<li>挂机胜利</li>

</ul>

<ul>

<li>打坐修炼 / 自动修炼</li>

</ul>

<ul>

<li>被动增长（每10秒）</li>

</ul>

<h3>5.2 修炼阶段划分</h3>

人物修为分为四个阶段，共 <strong>126 级</strong>：

<tr><td>阶段</td><td>境界范围</td><td>等级范围</td><td>特点</td></tr>

<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td><strong>前期</strong></td><td>练气 ~ 金丹</td><td>1~27</td><td>基础成长，突破需求低</td></tr>

<tr><td><strong>中期</strong></td><td>元婴 ~ 化神</td><td>28~45</td><td>成长加速，需要灵石和素材</td></tr>

<tr><td><strong>后期</strong></td><td>返虚 ~ 大乘</td><td>46~72</td><td>高级成长，突破需BOSS专属素材</td></tr>

<tr><td><strong>终局</strong></td><td>渡劫 ~ 大罗</td><td>73~126</td><td>极限成长，突破代价极高</td></tr>

每个大境界包含9重（如练气一重~练气九重），每9级为一个大境界。

<h3>5.3 升级经验计算</h3>

每级所需经验按指数增长：

<pre><code>

升级经验 = floor(100 × 1.15^(等级-1))

</code></pre>

代表等级的升级经验：

<tr><td>等级</td><td>境界</td><td>升级经验</td></tr>

<thead>

<tr><th>---:</th><th>---</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>1</td><td>练气一重</td><td>100</td></tr>

<tr><td>9</td><td>练气九重</td><td>307</td></tr>

<tr><td>10</td><td>筑基一重</td><td>352</td></tr>

<tr><td>27</td><td>金丹九重</td><td>2,985</td></tr>

<tr><td>28</td><td>元婴一重</td><td>3,433</td></tr>

<tr><td>45</td><td>化神九重</td><td>29,172</td></tr>

<tr><td>46</td><td>返虚一重</td><td>33,549</td></tr>

<tr><td>72</td><td>大乘九重</td><td>1,720,023</td></tr>

<tr><td>73</td><td>渡劫一重</td><td>1,978,028</td></tr>

<tr><td>126</td><td>大罗九重</td><td>6.78×10⁸</td></tr>

<h3>5.4 突破机制</h3>

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

突破成本计算：

<pre><code>

灵石消耗 = floor(100 × 1.3^(等级-1)) × 阶段倍率

修为消耗 = 升级经验 × 2 × 阶段倍率

阶段倍率 = { 前期:1, 中期:3, 后期:10, 终局:30 }

</code></pre>

<h3>5.5 每级基础数值提升</h3>

升级带来的基础属性增长：

<pre><code>

攻击 += floor(2 × 1.08^(等级-1))

生命 += floor(15 × 1.08^(等级-1))

防御 += floor(1.5 × 1.08^(等级-1))

速度 += floor(0.5 × 1.08^(等级-1))

</code></pre>

<h3>5.6 BOSS专属素材</h3>

每个地图有两个专属BOSS，击败后有10%~20%概率掉落突破素材。需要选择<strong>凶险及以上难度</strong>才有概率遇到：

<tr><td>遇到概率</td><td>凶险</td><td>绝境</td><td>灭世</td></tr>

<thead>

<tr><th>---:</th><th>---:</th><th>---:</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>遭遇BOSS</td><td>50%</td><td>75%</td><td>90%</td></tr>

各地图BOSS素材：

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

<tr><td>54</td><td>冰雪宫</td><td>冰晶</td><td>冰封核心</td></tr>

<tr><td>63</td><td>仙墟</td><td>仙人碎片</td><td>神性精华</td></tr>

<tr><td>72</td><td>混沌界</td><td>混沌水晶</td><td>虚空精华</td></tr>

<hr>

<h2>6. 转生渡劫系统</h2>

达到 <strong>50 级</strong> 可转生，重置等级为 1 但获得<strong>永久属性加成</strong>：

<pre><code>

第 N 世转生加成：

  攻击 +5N    生命 +50N    防御 +3N    速度 +2N

  修炼效率 +10%N    灵力效率 +10%N

</code></pre>

<ul>

<li>加成<strong>永久沉淀</strong>到 </code>baseAttributes<code> 与倍率，越转越强；</li>

</ul>

<ul>

<li>灵石、装备、物品、宗门成员<strong>全部保留</strong>；</li>

</ul>

<ul>

<li>适合中后期卡 Build 或想冲极限数值的玩家。</li>

</ul>

<hr>

<h2>7. 装备与 Build 体系</h2>

<h3>7.1 装备品质（rarity）</h3>

<tr><td>品质</td><td>名称</td><td>颜色</td><td>评分倍率</td><td>词条数</td></tr>

<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>common</td><td>凡品</td><td>灰</td><td>×1</td><td>0</td></tr>

<tr><td>uncommon</td><td>良品</td><td>绿</td><td>×1.5</td><td>0~1</td></tr>

<tr><td>rare</td><td>上品</td><td>蓝</td><td>×2</td><td>1~2</td></tr>

<tr><td>epic</td><td>极品</td><td>紫</td><td>×3.5</td><td>2~3</td></tr>

<tr><td>legendary</td><td>仙品</td><td>金</td><td>×6</td><td>3~4</td></tr>

<tr><td>mythic</td><td>神品</td><td>红</td><td>×10</td><td>4~5</td></tr>

<h3>7.2 装备槽位（12 + 法宝）</h3>

<pre><code>

weapon 武器 / head 头部 / body 衣服 / legs 裤子 / feet 鞋子

shoulder 肩甲 / hands 手套 / wrist 护腕 / necklace 项链

ring1 戒指 / ring2 戒指 / belt 腰带    ← 共 12 槽，宗门成员可装备

artifact 法宝                            ← 仅高难 Boss / 抽卡产出

</code></pre>

<h3>7.3 词缀（affix）与品质倍率</h3>

<ul>

<li>词条按 </code>tier<code> 分档：</code>tier1 ×1<code>、</code>tier2 ×1.5<code>、</code>tier3 ×2.5<code>；</li>

</ul>

<ul>

<li>高 tier 词条（如 </code>增伤/减伤/战意/抗性<code>）对 Build 评分贡献更大；</li>

</ul>

<ul>

<li>单件装备评分公式：</li>

</ul>

<pre><code>

装备评分 = round( (基础分 + 词条分 + 套装分) × 品质倍率 × (1 + 强化等级×0.1) )

</code></pre>

<h3>7.4 套装（setBonuses）</h3>

集齐同套装多件触发百分比加成：

<tr><td>套装件数</td><td>Build 加成分</td></tr>

<thead>

<tr><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>2 件</td><td>+200</td></tr>

<tr><td>3 件</td><td>+300</td></tr>

<tr><td>4 件</td><td>+500</td></tr>

<tr><td>5 件</td><td>+800</td></tr>

游戏内置 10 套（烈焰刃/玄铁卫/疾风影/血牙/雷霆击/不灭体/反击道/灵气髓/战斗王/道仙尊），覆盖攻、防、速、吸血、暴击、生命、修炼等方向。

<h3>7.5 套装详细数据</h3>

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

<blockquote><strong>套装选择建议</strong>：输出优先烈焰刃/血牙，坦克玄铁卫/不灭体，速度流疾风影，万能战斗王/道仙尊。4~5件套效果远超散件。</blockquote>

<h3>7.5 Build 强度（总评分）</h3>

<pre><code>

Build强度 = Σ(每件已装备评分) + Σ(套装激活分)

</code></pre>

<ul>

<li>挂机时，队伍总 Build = 所有出战成员的 Build 之和；</li>

</ul>

<ul>

<li>这是挂机「推荐 Build 匹配度」的判定基准。</li>

</ul>

<h3>7.6 Build 强度参考阶梯（BUILD_TIERS）</h3>

<tr><td>档位</td><td>名称</td><td>参考 Build</td><td>含义</td></tr>

<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>入门</td><td>入门</td><td>68,000</td><td>全稀有(+10)基础满装</td></tr>

<tr><td>强力</td><td>强力</td><td>686,000</td><td>传说/史诗混搭(+20)含套装</td></tr>

<tr><td>顶级</td><td>顶级</td><td>5,090,000</td><td>全神话(+50)含套装</td></tr>

<tr><td>极限</td><td>极限</td><td>20,000,000</td><td>全神话(+100)双五件套·混沌级</td></tr>

<h3>7.7 装备强化 / 洗练 / 出售</h3>

<ul>

<li><strong>强化</strong>：每级 </code>评分 ×(1+0.1×强化等级)<code>，吃强化石；可用<strong>淬灵丹</strong>提升下次成功率；</li>

</ul>

<ul>

<li><strong>洗练</strong>：重roll词条，吃洗练石；可用<strong>定灵丹</strong>保底不降属性；</li>

</ul>

<ul>

<li><strong>出售</strong>：</code>max(1, round(评分 × 0.1))<code> 灵石；</li>

</ul>

<ul>

<li><strong>分解</strong>：产出强化石/洗练石。</li>

</ul>

<hr>

<h2>8. 灵宠系统与放生报恩</h2>

灵宠出战后为人物提供<strong>全属性加成</strong>（攻击/防御/生命 + 一众战斗属性）。加成由「品质 × 星级 × 等级 × 阶位」综合决定：

<pre><code>

qualityBonusMap:  divine 15% / celestial 12% / mystic 9% / spiritual 6% / mortal 3%

每星加成:         各品质 1%~2%/星

每级加成:         (等级-1) × 基础加成 × 10%

每 5 星阶位:      阶位 × 基础加成 × 50%

最终加成 = 基础 + 星 + 等级 + 阶位（战斗属性取一半）

</code></pre>

<h3>8.1 灵宠操作</h3>

<ul>

<li><strong>升级</strong>（</code>upgradePet<code>）：吃灵宠精华，按品质倍率提升战斗属性；</li>

</ul>

<ul>

<li><strong>升星</strong>（</code>evolvePet<code>）：消耗同名同品质灵宠，星级 +1，并返还被吃灵宠已耗精华；</li>

</ul>

<ul>

<li><strong>装备到角色</strong>（</code>equipCharacterPet<code>）：在宗门页面为角色装备灵宠，加成实时叠加到最终属性；</li>

</ul>

<ul>

<li><strong>卸下灵宠</strong>（</code>unequipCharacterPet<code>）：从角色卸下灵宠，归还共享背包；</li>

</ul>

<ul>

<li><strong>放生报恩</strong>（</code>releasePet<code>）：放生灵宠获得精华回报。</li>

</ul>

<ul>

<li><strong>注意</strong>：灵宠<strong>不再使用全局出战/召回系统</strong>，所有灵宠管理统一在宗门→角色菜单下完成，背包中仅可查看灵宠详情。</li>

</ul>

<h3>8.2 灵宠放生报恩</h3>

放生灵宠会根据其<strong>稀有度</strong>返还一定量的<strong>灵宠精华</strong>作为「报恩」：

<pre><code>

返还精华 = 稀有度基础 + 等级×2 + 星级×5

</code></pre>

<tr><td>灵宠品质</td><td>基础返还精华</td></tr>

<thead>

<tr><th>---</th><th>---:</th></tr>

</thead>

<tbody>

<tr><td>神品 divine</td><td>100</td></tr>

<tr><td>仙品 celestial</td><td>60</td></tr>

<tr><td>玄品 mystic</td><td>35</td></tr>

<tr><td>灵品 spiritual</td><td>20</td></tr>

<tr><td>凡品 mortal</td><td>10</td></tr>

<blockquote>放生后灵宠感恩离去，精华实时到账。养成高星高等级的灵宠放生回报更丰厚。</blockquote>

<hr>

<h2>9. 挂机探索系统（含小剧场）</h2>

挂机是放置收益的核心。每 <strong>15 秒</strong> 一场遭遇，按地图 </code>rewards<code> 掉落结算。

<h3>9.1 队伍协同战斗</h3>

<ul>

<li>挂机时按<strong>队伍总 Build 强度</strong>与地图推荐 Build 计算匹配度；</li>

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

<h3>9.2 小剧场系统（idleBuffs）</h3>

挂机过程中会<strong>随机触发队伍小剧场</strong>，为本次挂机提供临时增益或减益 buff：

<ul>

<li>共 <strong>15 种小剧场</strong>，涵盖切磋、寻宝、内讧、感悟、中毒、灵泉等情境；</li>

</ul>

<ul>

<li>buff 类型包括：</code>cultivation<code>（修炼）、</code>combat<code>（战斗）、</code>attack<code>（攻击）、</code>speed<code>（速度）、</code>luck<code>（气运）；</li>

</ul>

<ul>

<li>buff 有<strong>持续场次</strong>，每场遭遇后递减，归零后失效；</li>

</ul>

<ul>

<li>部分为<strong>负向 buff</strong>（内讧、士气低落、受惊等），降低当次挂机效率。</li>

</ul>

<strong>小剧场示例</strong>：

<tr><td>小剧场</td><td>buff 类型</td><td>效果</td><td>持续</td><td>性质</td></tr>

<thead>

<tr><th>---</th><th>---</th><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>篝火笑话</td><td>心情愉悦</td><td>修炼+15%</td><td>5场</td><td>增益</td></tr>

<tr><td>抢摘灵草</td><td>内讧</td><td>战斗-10%</td><td>3场</td><td>减益</td></tr>

<tr><td>灵泉滋养</td><td>灵泉滋养</td><td>战斗+15%</td><td>5场</td><td>增益</td></tr>

<tr><td>走火入魔</td><td>默契提升</td><td>战斗+10%</td><td>5场</td><td>增益</td></tr>

<tr><td>切磋武艺</td><td>切磋增益</td><td>攻击+20%</td><td>4场</td><td>增益</td></tr>

<tr><td>古碑参悟</td><td>功法感悟</td><td>修炼+25%</td><td>6场</td><td>增益</td></tr>

<tr><td>争夺矿石</td><td>士气低落</td><td>战斗-15%</td><td>3场</td><td>减益</td></tr>

<tr><td>踩中陷阱</td><td>受惊</td><td>战斗-12%</td><td>3场</td><td>减益</td></tr>

<tr><td>游方老道</td><td>气运加持</td><td>气运+30%</td><td>5场</td><td>增益</td></tr>

<blockquote>小剧场文案会自动填入队伍中随机 3 名成员的名字（</code>\${m1}<code>/</code>\${m2}<code>/</code>\${m3}<code>），增加代入感。</blockquote>

<h3>9.3 实时结算画面</h3>

挂机日志下方会<strong>实时显示当前最新一场遭遇的结算画面</strong>（而非结束后才显示），包括：

<ul>

<li>当前遭遇次数与胜负；</li>

</ul>

<ul>

<li>敌人名称与层级；</li>

</ul>

<ul>

<li>本场获得的所有奖励明细；</li>

</ul>

<ul>

<li>队伍各成员实时气血状态；</li>

</ul>

<ul>

<li>当前生效的小剧场 buff 列表。</li>

</ul>

<h3>9.4 挂机收益</h3>

每场遭遇还会<strong>额外产出幻灵结晶</strong>（抽卡专用货币），数量随秘境难度递增（青萝林·游历约3~5/场，混沌界·灭世约16~25/场）。

各秘境「凶险(标准)档」的掉落配置：

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

<tr><td>冰雪宫</td><td>6</td><td>×5.0</td><td>56%</td><td>神品</td><td>48%</td><td>神品</td></tr>

<tr><td>仙墟</td><td>7</td><td>×7.0</td><td>64%</td><td>神品</td><td>40%</td><td>神品</td></tr>

<tr><td>混沌界</td><td>8</td><td>×10.0</td><td>70%</td><td>神品</td><td>55%</td><td>神品</td></tr>

<h3>9.5 推荐 Build 与匹配度</h3>

<pre><code>

推荐Build(某难度) = 基础Build × 难度缩放系数

匹配度 = 队伍总Build强度 ÷ 推荐Build

</code></pre>

<ul>

<li>匹配度 ≥ 100%：稳定挂机，气血稳步回升；</li>

</ul>

<ul>

<li>匹配度 < 100%：按不足比例持续掉血，<strong>全队力竭即提前结束</strong>；</li>

</ul>

<ul>

<li>胜利额外回血，失败重创。</li>

</ul>

<h3>9.6 五档难度系数</h3>

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

<hr>

<h2>10. 八大秘境 × 五档难度 全数据表</h2>

</code>ZONE_BUILD_BASE<code>（凶险档推荐 Build）与分区推荐属性：

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

<tr><td>冰雪宫</td><td>6</td><td>300</td><td>3,000</td><td>800,000</td><td>240,000</td><td>480,000</td><td>1,280,000</td><td>2,000,000</td></tr>

<tr><td>仙墟</td><td>7</td><td>600</td><td>6,000</td><td>2,000,000</td><td>600,000</td><td>1,200,000</td><td>3,200,000</td><td>5,000,000</td></tr>

<tr><td>混沌界</td><td>8</td><td>1,000</td><td>10,000</td><td>7,000,000</td><td>2,100,000</td><td>4,200,000</td><td>11,200,000</td><td>17,500,000</td></tr>

<blockquote>纵向看：从青萝林到混沌界，推荐 Build 从 3,000 平滑爬升到 700 万（凶险），灭世档高达 1,750 万——这正是「Build 阶梯」(入门 6.8万 → 强力 68.6万 → 顶级 509万 → 极限 2000万) 的用武之地。</blockquote>

<hr>

<h2>11. 仙缘祈福系统</h2>

<h3>11.0 祈福货币：幻灵结晶</h3>

抽卡使用<strong>幻灵结晶</strong>（非灵石）。获取途径：

<ul>

<li><strong>挂机产出</strong>：每场遭遇自动产出幻灵结晶，数量随秘境难度递增：</li>

</ul>

  - 青萝林·游历：~3-5/场（5分钟约50-70个）

  - 混沌界·灭世：~16-25/场（30分钟约2000-3000个）

<ul>

<li><strong>灵石兑换</strong>：50 灵石 = 1 幻灵结晶，在抽卡页面可批量兑换（10/50/100）；</li>

</ul>

<ul>

<li><strong>新手福利</strong>：新账号领取 20,000 幻灵结晶。</li>

</ul>

<h3>11.1 奖池总览</h3>

抽卡<strong>不一定 100% 抽到人物</strong>。人物概率 10%~25%，其余为灵石、装备、素材等。

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

<blockquote><strong>注意</strong>：资源奖励中的灵石返还量为 <strong>20~80 灵石</strong>（低于单次抽奖成本），确保抽卡不会「回本」，保持经济平衡。</blockquote>

<h3>11.2 角色星级概率</h3>

<pre><code>

5星 = 3%    4星 = 20%    3星 = 77%

</code></pre>

<h3>11.3 保底机制</h3>

<ul>

<li><strong>人物池 / 综合池</strong>：每 <strong>5 次</strong>抽卡保底一次 <strong>4★ 或以上</strong>角色；</li>

</ul>

<ul>

<li>若 5 次内未出现 4★+，第 5 次自动替换为 4★ 角色。</li>

</ul>

<h3>11.4 稀有角色立绘弹窗</h3>

抽到 <strong>4★ 或 5★</strong> 角色时，会<strong>自动弹出角色立绘详情</strong>（含名称、描述、流派、天赋、定位、基础属性）：

<ul>

<li>单抽：抽到 4★/5★ 即弹窗；</li>

</ul>

<ul>

<li>十连：自动展示最高星级角色的立绘。</li>

</ul>

<h3>11.5 装备品质权重</h3>

凡品 40% / 良品 30% / 中品 18% / 上品 8% / 极品 3% / 仙品 1%。

<h3>11.6 灵宠品质权重</h3>

凡品 50% / 灵品 25% / 玄品 15% / 仙品 8% / 神品 2%。

<h3>11.7 重复角色处理</h3>

抽到已有的角色会<strong>自动转换为人精华</strong>（用于角色突破境界）：

<pre><code>

人精华 = star × 10 + (star >= 4 ? 20 : 0)

3★ → 30 精华    4★ → 60 精华    5★ → 70 精华

</code></pre>

<hr>

<h2>12. 丹药炼制系统</h2>

丹药按「品阶 grade (1~9)」决定<strong>基础成功率</strong>（一品 90% → 九品 10%）与材料需求。按功能分四类，效果随等级放大：

<tr><td>类型</td><td>倍率</td><td>代表丹药</td></tr>

<thead>

<tr><th>---</th><th>---</th><th>---</th></tr>

</thead>

<tbody>

<tr><td>灵力类</td><td>×1.0</td><td>聚灵丹、回灵丹、日月丹(灵力上限)</td></tr>

<tr><td>修炼类</td><td>×1.2</td><td>聚气丹、凝元丹、天元丹</td></tr>

<tr><td>属性类</td><td>×1.5</td><td>雷灵丹、五行丹、火元丹</td></tr>

<tr><td>特殊类</td><td>×2.0</td><td>仙灵丹、涅槃丹、清心丹、渡厄丹</td></tr>

<strong>关键丹药</strong>：

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

<blockquote>永久类（洗髓/锻骨）直接把数值写进 </code>baseAttributes<code> 并随存档沉淀，转生也保留。</blockquote>

<hr>

<h2>13. 战斗系统公式</h2>

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

<blockquote>实战要点：<strong>最终增伤/减伤、暴伤、吸血、连击</strong> 是后期碾压的核心；堆叠 </code>combatBoost<code> 与 </code>resistanceBoost<code> 能同时放大攻防两端。</blockquote>

<hr>

<h2>14. 进阶策略与成长路线</h2>

<h3>前期（练气 ~ 金丹，1~27 级）</h3>

<ul>

<li>主线：手动/自动打坐把修为堆上去，靠突破把 </code>spiritRate<code> 复利拉起来；</li>

</ul>

<ul>

<li>资源：低难挂机（青萝林/迷雾谷 游历~试炼）攒灵石、灵草、幻灵结晶；</li>

</ul>

<ul>

<li>宗门：用综合池/人物池抽角色组队，5 人满编；新手福利 20,000 幻灵结晶开局抽卡；</li>

</ul>

<ul>

<li>炼丹：优先 <strong>聚灵丹(灵力)、聚气丹(修炼)、洗髓/锻骨丹(永久属性)</strong>；</li>

</ul>

<ul>

<li>装备：抽卡综合池拿第一套良品/上品，凑 2 件套即可。</li>

</ul>

<h3>中期（元婴 ~ 化神，28~45 级）</h3>

<ul>

<li>目标：队伍总 Build 冲到 <strong>入门(6.8万)~强力(68.6万)</strong>；</li>

</ul>

<ul>

<li>装备：进凤凰窟/龙渊 凶险~绝境，挂机出极品/仙品；集齐 1~2 套 4 件套；</li>

</ul>

<ul>

<li>灵宠：玄品/仙品出战，开始升级+升星；多余灵宠<strong>放生报恩</strong>换精华；</li>

</ul>

<ul>

<li>突破：60% 地板后用 <strong>渡厄丹</strong> 兜底；</li>

</ul>

<ul>

<li>丹药：悟道丹+寻宝丹叠加，挂机收益最大化；</li>

</ul>

<ul>

<li>重复角色转人精华用于突破。</li>

</ul>

<h3>后期（返虚 ~ 大乘，46~72 级）</h3>

<ul>

<li>目标：Build 冲 <strong>顶级(509万)</strong>，挑战鬼荒原/冰雪宫 绝境~灭世；</li>

</ul>

<ul>

<li>装备：神品为主，法宝(artifact)优先补位；强化 +20~+50；</li>

</ul>

<ul>

<li>灵宠：仙品/神品满星，精华集中养 1~2 只核心；</li>

<li>解锁可装备的装备「境界要求」(</code>requiredRealm\`)；</li>

<li>作为 Build 匹配度判定外的另一条进度主线；</li>

<li>每级增加少量基础属性（攻击/生命/防御/速度）。</li>

</ul>

<ul>

<li>转生：满 50 级可转生，永久 +攻/血/防/速 与 10% 效率，越转越强。</li>

</ul>

<h3>终局（渡劫 ~ 大罗，73~126 级）</h3>

<ul>

<li>目标：Build 逼近 <strong>极限(2000万)</strong>，混沌界 灭世稳定挂机；</li>

</ul>

<ul>

<li>全神话双五件套、法宝满配、神品满星灵宠、多次转生叠永久属性；</li>

</ul>

<ul>

<li>利用被动修为与离线结算，放置即可持续逼近大罗九重 1.4 亿修为上限。</li>

</ul>

<h3>通用技巧</h3>

<ol>

<li><strong>队伍编成</strong>：5 人满编，注意定位搭配（先锋+刀锋输出、护法抗伤、药引续航、掌阵增益）；</li>

</ol>

<ol>

<li><strong>Build 优先于等级</strong>：与其猛冲等级，不如先把 Build 堆到匹配当前图；</li>

</ol>

<ol>

<li><strong>套装 > 散件</strong>：4~5 件套的 Build 分与百分比加成远超单件；</li>

</ol>

<ol>

<li><strong>幻灵结晶管理</strong>：挂机是幻灵结晶的主要来源，尽量保持挂机不断；灵石充足时可兑换应急；</li>

</ol>

<ol>

<li><strong>小剧场 buff</strong>：挂机时留意小剧场触发，正向 buff 可显著提升效率，负向 buff 时可考虑暂停或换图；</li>

</ol>

<ol>

<li><strong>灵力倍率复利</strong>是隐藏引擎：多突破 = 灵力回得快 = 修炼不停；</li>

</ol>

<ol>

<li><strong>永久丹药</strong>早吃早享受，转生不丢；</li>

</ol>

<ol>

<li><strong>灵宠放生</strong>：养成后再放生回报更高（等级×2 + 星级×5）；</li>

</ol>

<ol>

<li><strong>匹配度 < 100% 别硬挂</strong>：会力竭提前结束，先把 Build 或难度降一档。</li>

</ol>

<hr>

<h2>15. 数据附录：关键公式汇总</h2>

<pre><code>

// —— 修为公共池 ——

修为获取     = 挂机胜利 + 打坐修炼 + 被动增长

修为分配     = 从公共池分配给指定角色，自动升级和突破

升级经验     = floor(100 × 1.15^(等级-1))

突破条件     = 等级为9的倍数时需突破（消耗灵石+修为+BOSS素材）

阶段倍率     = { 前期:1, 中期:3, 后期:10, 终局:30 }

被动修为/10s = max(1, floor(等级×0.8 + Build×0.00001))



// —— 宗门 ——

重复角色转化 = star × 10 + (star >= 4 ? 20 : 0)   // 3★=30 / 4★=60 / 5★=70

角色Build   = (基础属性分 + Σ装备评分 + 灵宠分 + 套装激活分) × (1+(等级-1)×0.02)

队伍总Build  = Σ(各出战成员Build)



// —— 幻灵结晶 ——

挂机产出/场 = floor(2 + 秘境难度×1.5 + 难度缩放×3) × (0.8~1.2)

灵石兑换    = 50灵石 : 1幻灵结晶

新手福利    = 20,000 幻灵结晶



// —— 装备评分 ——

装备评分 = round((基础分 + 词条分 + 套装分) × 品质倍率 × (1 + 强化等级×0.1))

品质倍率   = common1 / uncommon1.5 / rare2 / epic3.5 / legendary6 / mythic10

词条tier倍 = tier1×1 / tier2×1.5 / tier3×2.5

套装激活分 = 2件+200 / 3件+300 / 4件+500 / 5件+800

Build强度  = Σ(已装备评分) + Σ(套装激活分)



// —— 挂机 ——

推荐Build(难度) = ZONE_BUILD_BASE × 难度缩放(0.3/0.6/1.0/1.6/2.5)

匹配度         = 队伍总Build ÷ 推荐Build

胜利修为       = round(5 × 地图难度 × (1 + 匹配度×0.5))



// —— 小剧场 buff ——

buff持续 = duration 场遭遇，每场 -1，归零失效

增益类型 = cultivation(修炼) / combat(战斗) / attack(攻击) / speed(速度) / luck(气运)



// —— 灵宠加成 ——

最终加成 = 品质基础(3%~15%) + 星级(1%~2%/星) + 等级(基础×10%×(级-1)) + 阶位(基础×50%×floor(星/5))

战斗属性取最终加成的一半



// —— 灵宠放生报恩 ——

返还精华 = 稀有度基础(凡10/灵20/玄35/仙60/神100) + 等级×2 + 星级×5



// —— 抽卡 ——

抽卡货币   = 幻灵结晶（非灵石）

角色概率   = 综合池15% / 人物池25%（其余为装备/灵宠/资源）

角色星级   = 5星3% / 4星20% / 3星77%

保底       = 人物池/综合池 每5次保底4★+

资源灵石   = 20~80（低于单次抽卡成本）



// —— 战斗 ——

伤害 = 攻击×(1+combatBoost) ×[暴击1.5+暴伤] ×[连击1.3] ×(1+最终增伤)

     × 100/(100+防御×(1+combatBoost)) ×(1−暴伤减免,若暴击) ×(1−最终减伤)

闪避 = 守方闪避 − 攻方抗闪避；  反击 = 守方反击 − 攻方抗反击

</code></pre>

<hr>

<blockquote>📌 本手册数据均取自当前版本源码。版本更新后数值可能调整，请以游戏内实际表现为准。祝洞天早登大罗！</blockquote>`