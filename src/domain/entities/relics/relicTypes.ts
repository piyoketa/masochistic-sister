/*
relicTypes.ts の責務:
- レリック ID を文字列リテラルのユニオン型として一元管理し、OperationLog や Snapshot で型安全に参照できるようにする。

非責務:
- レリックの生成や状態管理（それらは relicLibrary や Relic クラスが担う）。
- UI 表示文言の決定やアイコン選択（relic 定義側が担当する）。

主な通信相手:
- `Relic` / `ActiveRelic` クラス: `id` プロパティの型注釈として利用。
- Battle/Log 層: Operation や Snapshot でレリック識別子を扱う際の型として参照する。
*/
export type RelicId =
  | 'action-force'
  | 'adversity-excitement'
  | 'arcane-adaptation'
  | 'death-match'
  | 'devils-kiss'
  | 'devout-believer'
  | 'daily-routine-relic'
  | 'holy-protection'
  | 'lightweight-combat'
  | 'memory-saint-relic'
  | 'no-violence'
  | 'pure-body'
  | 'redraw-relic'
  | 'repulsion'
  | 'sacrificial-awareness'
  | 'slippery-touch'
  | 'thorough-preparation'
