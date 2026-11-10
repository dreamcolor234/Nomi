# 认证恢复方向检查（独立复盘，2026-11-10）

复盘线：`/root/direction_recovery_review`，未参与历史修补和本次实现。先读模板、`origin/main` 源码、历史合同与真实旧记录，在给协调线独立初判后才读本次方案和 staged diff；未改生产代码、测试或本机配置。`fix-churn` 实测命中：`store.ts` 近 14 天已有 2 个 fix，`providerAdapter/` 已有 10 个 fix。此结论供用户按 RW 拍板，不能以门岗通过代替。

用户已于 2026-11-10 明确批准提交本方案，范围仅 `dreamcolor234/Nomi` fork；不向上游创建 PR。协调线继续遵守不触发 GitHub Actions 的约束。

## 0. 一句话根因

**永久防重账本与当前自检卡的寿命没有分开：合法删除投影没有留下撤销身份，启动恢复遂把“已撤销”误判成“意外丢失”，重新制造失败卡。** 属于 recurring，不能靠清一次本机数据解决。

## 1. 归类与原话

| 历史 / 症状 | 直接原因 | 类与现役约束 |
|---|---|---|
| 2026-08-28 幂等认证合同 | 重复开始、未知提交曾可能重复创建远端任务 | 永久保留幂等身份、未知提交和晋升日志；原话：`One idempotency key is permanently bound to one immutable effective contract digest` |
| 2026-09-05 红色验证状态复活合同 | 连接改变与验证投影分属不同存储 | 原话：`Historical certification ledgers remain audit evidence; only the user-facing adapter run/revision projections are revoked.` 但删除后缺少持久撤销证据 |
| 本次 CDN 0/3、canonical run missing、4,597,469 秒 | `recoverPreparedStarts` 只见 `startTransaction=committed` 就重建缺失 run，沿用旧创建时间 | 恢复依据缺少投影寿命；时间错用记录年龄 |

真实无凭据夹具独立核对：run 创建于 **2026-09-17 05:26:01.953 UTC**，失败投影更新于 **2026-11-09 10:30:31.647 UTC**；operation 已 `finalized`，六个 mode 均 `settled`，pending journal 为 0，精确旧 vendor 已不存在。二者相差的整秒正是 4,597,469；这不是自检跑了 53 天。当前同名图片模型不能充当旧连接仍在的证据。2026-10-31 `4bd454d6c` 及接入计划“升级时不动老模型”仍有效，本次不得借恢复改现役目录或凭据。热点目录中的其他能力投影修补不能仅因同目录就断言同一根因。

## 2. 为什么反复出现

历史合同分别正确守住了“审计不能删”和“旧验证应撤销”，却没有一份可被删除者、迟到写者、幂等读取者和恢复者共同执行的撤销事实。`store.deleteRunsForVendors` 删除后，账本仍足以启动重建。对应体验铁律 **⑫ 点了=以为的**：用户移除/纠正连接后，重启不应复活旧自检身份；⑩/⑪ 本次不改变意图参数和模型可选项。结账挂 `projectionRecovery.test.ts` 的双重启、晚写入、未知提交、pending promotion 类检查及 `vendorValidationPersistence.test.ts` 的真实目录失效入口矩阵。

## 3. 不改结构的预测

| 可验证预测 | 量具 |
|---|---|
| 只清一次 JSON，下一次启动仍会从 ledger 重建 | 旧夹具删除 run 后连续两次实例恢复 |
| 只跳过不存在 vendor，会漏掉仍存在但 Key/范围已改变的连接 | `vendorValidationPersistence.test.ts` 的 scope/clear/disable 路径 |
| 只阻止启动重建，旧 worker/幂等重复开始/晋升仍可能回写 | store 晚写入与 `projectionRecovery.test.ts` 的重复 intent/pending replay |

## 4. 靶子独立性

本线的判断先于本次方案；原始旧记录、基线源码和两份历史合同互相印证。动结构前红态没有由本线重跑；实现记录报告 7 项失败，独立验收线 `/root/public_transport_review` 已另行执行回归，不能写成本线实测。本线执行了 `fix-churn` 和 `door-map`：六个关键符号命中 10 扇直接写门，覆盖 catalog 失效、服务、协调器及终态补偿；随后审阅共用 store 准入。回归既要求撤销卡消失，也要求真正丢失的未撤销 run 继续 fail-closed，不能以一律隐藏或一律成功为尺子。

## 5. P0 与现成机制

通用持久化、锁、原子写入继续复用现有实现，不另造存储或任务框架。撤销标记是已有永久身份/墓碑模式在投影层的应用；“哪个连接租约仍可发布哪次认证”属于 Nomi 领域，换通用库不能代替这条判据。本次依赖决策为 `not-applicable`；无引入或重写框架的必要。

## 6. 三条路与当前方案审查

| 选项 | 做什么 | 代价 / 风险 | 判断 |
|---|---|---|---|
| 沿原方向补 | 只按 vendor 不存在跳过，或只修计时/隐藏卡 | 少改代码；现存连接失效、异步回写和旧 intent 仍可复发 | 不推荐 |
| **换模式** | **永久 ledger 管防重/未知结算，run store 管当前投影及持久撤销；恢复、晚写入和晋升共用撤销身份** | 增加少量 run-ID 元数据；需保守迁移和多入口回归。旧 intent 不能被当作新请求复活 | **推荐：当前补丁正是这一结构调整，可继续** |
| 删掉最小机制 | 删“终结旧账本可无条件重建已经撤销的卡”这项行为；保住真实意外丢失的 fail-closed 恢复 | 单独全删重建会掩盖真实损坏；删 ledger 会破坏防重 | 推荐项应同时删除这段旧行为，不能删永久账本 |

当前 staged diff 通过结构审查：撤销与删除在 store 同一锁内事务落盘；run/input/终态写入在共享边界拒绝旧身份；幂等重复开始不另分配 run；晋升重放先看撤销且不伪造日志结算。旧数据自动退役须同时满足 finalized、有 mode、全部 settled、无 pending promotion、精确旧连接确实不存在；目录不可读/无证据保持 fail-closed。没有供应商或模型名特例，没有改现役模型/Key，没有新 UI。**建议保留当前最小实现，不再叠第三条特殊恢复分支，也不需要重写整个认证系统。**

## 7. 用户要权衡的核心与本机补丁

**让已经撤销的旧自检身份永久退出当前卡片，同时保留不可见的防重证据；以后重新自检必须是新的明确意图，未知旧提交仍会阻止不安全重试。** 这与历史决策一致，新增的是能跨重启执行的撤销事实。

**无技术必要撤销已安装补丁。** 协调线已报告真安装重启后旧卡消失、无 API 请求，catalog、加密凭据与 ledger 逐字不变；本线的源码审查未发现与该结果相冲突的风险。源码提交仍应等待用户对上述结构拍板。明确限制：已挂载 renderer 的旧任务缓存可能需重新打开设置/重启才消失；旧版本程序不理解新撤销字段，降级会丢失此保证。如用户否决方案，应恢复程序包备份，不能删永久 ledger 或把旧提交改成成功。

特征与类回归：`electron/providerAdapter/projectionRecovery.test.ts`、`electron/providerAdapter/store.test.ts`、`electron/catalog/vendorValidationPersistence.test.ts`；相邻保护为 promotion journal、service、terminal guarantee 与计时 view-model 测试。真实 UI/完整 gates 的结果归协调线交付证据，本线不把未执行项报绿。

## 发布前补充：显式断开与候选清理（2026-11-10）

**独立结论：当前补充仍落实用户已批准的结构方向，无需另作方向请示。** 上文“源码提交等待拍板”是批准前状态；用户已批准且交付范围仍仅 fork，不建上游 PR。

升级矩阵发现本次引入的边界错误：自动清理未发布候选与用户明确断开都调用 `tx.deleteVendor`，因此候选自检失败后，正常清理候选会被误记为用户撤销，把应交给用户的真实失败回执一并拒掉。这证明“目录行已不存在”本身不足以表示“用户不再要这次回执”；原方案要求的是**显式撤销身份**，不能把所有内部删除都升级成撤销意图。

本线重新审阅当前生产 diff 并全仓检索调用，确认五处自动清理都显式传入 `discard-candidate`：`serviceCatalog` 的 register/stage/fail、`catalogCommit` 的接入提交、`comfyuiWorkflowImportStore` 的候选 stage。四处替换仍使用既有未发布 superseded 候选清单，fail 仍要求候选归属且无已发布执行。共用事务默认意图仍是 `disconnect`，用户断开及 Key/范围失效继续撤销；store 的 run-ID 写入准入未放宽。这是在同一边界写清已有两类动作的目的，没有供应商特例或新增恢复架构。

旧数据退役也相应收紧：除原有 finalized、有 settled mode、无 pending promotion、精确连接已不存在外，还必须**没有 run，或 run 是带 `certification_start_rolled_back` 类型原因的合成 failed 恢复记录**。真实 failed/completed 回执保留；识别不依赖错误字符串。永久 ledger、未知提交、幂等绑定及已撤销身份仍按原合同保护。该变化删除了“候选消失就等于用户撤销”的过宽推断，保住 ⑫ 的另一半：用户确实发起的自检必须留下真实结果。

证据归属：本线审阅生产与回归 diff，未重跑测试、未改生产/测试。独立验收线在 `2026-11-10-certification-projection-acceptance.md` 补充记录 **39/39**（升级、恢复、目录失效矩阵）和 **7/7**（配置复制与 Windows 扫描）；协调线报告实施侧七文件 **100/100**。其中失败后重启、真实 failed/completed 连续恢复、显式 disconnect 与候选 disposal 已分别立靶，原升级断言保留。未发现需要撤销用户已批准方向的证据；最终安装与普通推送结果仍由协调线交付。
