
# AI 架构

## 决策入口

`chooseAiAction(state, playerId, difficulty)` 每次重新调用 `getLegalActions`。返回的 Action 交由 `performAction` 执行，策略代码不写入状态、不读取 DOM。

## 难度

- `RANDOM`：在候选合法行动中按种子确定性随机。
- `GREEDY`：按声望、折扣、贵族推进、目标缺口、黄金成本和预留威胁评分。
- `PLANNER`：选择短期目标卡，优先购买、必要时预留，再按资源缺口拿取宝石。

所有难度共享预留位安全约束：已有两张预留卡且存在非预留合法行动时，不再占满第三格。这防止随机牌表下公共宝石池被耗尽时出现无合法行动。

## 浏览器与无界面运行

`browser-ai-runner.js` 只检测当前控制器并调度动作；混合对局使用可见思考延迟，四 AI 对局使用较短延迟。`simulation/simulator.js` 则同步执行相同决策入口，并在批量测试中轮换 AI 座次，避免先手胜率混入难度偏差。

模拟命令示例：

```powershell
npm run simulate -- --games=1000 --seed=42 --levels=RANDOM,GREEDY,PLANNER,RANDOM
```

