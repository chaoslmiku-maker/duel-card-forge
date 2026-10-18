/**
 * 决斗卡牌工坊 —— 程序扩展入口。
 *
 * 一个模块同时提供：
 *   - 可视化 UI：卡牌编辑 / 卡组 / 规则 / 对战
 *   - 项目设置：卡牌库与规则的 JSON（由面板可视化编辑并持久化到 project.json）
 *   - 存档字段：卡组与战绩（跟随存档槽位）
 *   - 剧本方法：重置示例卡组、读取卡牌数量
 */

import {
  Extension,
  defineSave,
  meta,
  settings,
  type ExtensionRenderData,
} from "@avg-studio/sdk";
import { STARTER_CARDS, STARTER_DECK } from "./data/starter-cards";
import { DuelApp, type DuelAppProps } from "./ui/app";
import { normalizeCards } from "./types";

const duelSave = defineSave({
  deck: {
    type: "list",
    persistence: "slot",
    default: STARTER_DECK,
    label: "当前卡组",
  },
  wins: { type: "number", persistence: "slot", default: 0, label: "胜场" },
  losses: { type: "number", persistence: "slot", default: 0, label: "败场" },
});

export class DuelCardForge extends Extension.withSave(duelSave)<DuelAppProps> {
  static meta = meta({
    id: "duel-forge",
    label: "决斗卡牌工坊",
    description: "可视化自由编辑规则的卡牌战斗：攻击力 / 守备力 / 种族 / 花费 / 效果 / 立绘。",
    category: "卡牌战斗",
  });

  static settings = settings((s) => ({
    cardsJson: s
      .string("卡牌库 JSON")
      .multiline()
      .default("")
      .describe("留空时使用内置示例卡。通过「卡牌库」页导出/导入，或在这里直接粘贴 JSON。"),
    rulesJson: s
      .string("对战规则 JSON")
      .multiline()
      .default("")
      .describe("留空时使用默认规则（8000 LP / 3 怪兽区 / 祭品召唤……）。可在「规则」页可视化修改。"),
  }));

  /** 剧本方法：把卡组恢复成内置示例卡组。 */
  static resetDeck = this.method({
    title: "重置卡组为示例",
    description: "把当前存档的卡组替换为内置示例卡组（37 张）。",
    schema: {},
    run() {
      this.save.set("deck", STARTER_DECK);
    },
  });

  /** 剧本方法：直接打开工坊面板（全屏程序 UI）。 */
  static openForge = this.method({
    title: "打开卡牌工坊",
    description: "在游戏中全屏打开决斗卡牌工坊（卡牌库/卡组/规则/对战四页）。",
    schema: {},
    async run(ctx) {
      await ctx.ui.show("duel-forge", undefined, {
        size: "(100%, 100%)",
        position: "(0, 0)",
        interactable: true,
        modal: true,
      });
    },
  });

  /** 剧本方法：读取卡牌库数量，可在 If 条件里直接使用。 */
  static cardCount = this.method({
    title: "读取卡牌数量",
    description: "读取当前项目卡牌库中的卡牌张数。",
    schema: {},
    returns: { type: "number", label: "卡牌数量" },
    run(ctx) {
      const raw = ctx.settings.get<string>("cardsJson");
      if (!raw) return STARTER_CARDS.length;
      try {
        const cards = normalizeCards(JSON.parse(raw) as unknown);
        return cards.length;
      } catch {
        return STARTER_CARDS.length;
      }
    },
  });

  render(): ExtensionRenderData<DuelAppProps> {
    return {
      component: DuelApp,
      props: { save: this.save },
    };
  }
}

export default DuelCardForge;

// 剧情 Block：开始战斗 / 印卡 / 加入卡牌 / 修改卡牌 / 直接召唤
export {
  DirectSummonBlock,
  GiveCardBlock,
  ModifyCardBlock,
  PrintCardBlock,
  StartBattleBlock,
} from "./blocks/story-blocks";
