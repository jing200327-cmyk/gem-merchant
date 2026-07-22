# 宝石商人项目上下文

## 当前版本

- 产品名：宝石商人
- 版本：V0.3.0
- 模式：2–4 个真人/AI 混合席位，支持四 AI 自动对局
- 技术：原生 ES Modules，零第三方依赖，零构建
- 随机性：每局保存 32 位随机种子；相同种子和 AI 配置可确定性复现

## 核心边界

规则引擎只处理普通 JavaScript 数据，不访问 DOM。真人 UI、AI、模拟器和未来服务端共用：

```js
const legal = getLegalActions(state, playerId);
const nextState = performAction(state, action);
```

AI 控制器从合法行动集合中筛选并评分，不直接修改 `state`。每个成功动作都进入结构化日志和快照，可用初始状态加动作日志完整重放。

## 状态机

| 状态 | 允许输入 | AI 行为 |
|---|---|---|
| `AWAITING_ACTION` | 六类主要行动 | 随机或评分选择 |
| `RETURNING_GEMS` | `RETURN_GEMS` | 枚举合法归还组合 |
| `CHOOSING_NOBLE` | `CHOOSE_NOBLE` | 从候选贵族选择一个 |
| `TURN_TRANSITION` | `ACKNOWLEDGE_TURN` | 只提交确认动作 |
| `GAME_OVER` | 无 | 停止调度 |

`CONFIRMING_PURCHASE` 与 `ANIMATING` 保留给后续体验版本。

## AI 与模拟

三档 AI 共用 `chooseAiAction(state, playerId, difficulty)`。控制器保留预留位安全余量，避免随机生成牌表和资源囤积组合导致死锁。浏览器调度器只负责延迟与派发，决策模块不访问 DOM。

模拟器设置最大轮数保护并统计异常、轮数、分数、卡牌、贵族、预留、黄金、先手、难度和平局。批量模拟可通过 `snapshotLimit: 0` 关闭中间快照以提升压力测试吞吐，但动作日志仍完整保留。

## 存档边界

JSON 存档上限 1MB。导入校验版本、阶段、待处理数据、控制器配置、玩家、资源、市场、牌堆和动作类型。
