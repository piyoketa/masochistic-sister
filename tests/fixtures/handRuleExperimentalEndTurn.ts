import type { ActionLogEntrySummary } from '../integration/utils/battleLogTestUtils'

export const HAND_RULE_EXPERIMENTAL_END_PLAYER_TURN: ActionLogEntrySummary = {
  "type": "end-player-turn",
  "animationBatches": [
    {
      "batchId": "turn-end:2",
      "snapshot": {
        "id": "battle-1",
        "player": {
          "id": "player-1",
          "name": "聖女",
          "currentHp": 150,
          "maxHp": 150,
          "currentMana": 3,
          "maxMana": 3,
          "states": []
        },
        "enemies": [
          {
            "id": 0,
            "name": "オーク",
            "image": "/assets/enemies/orc.jpg",
            "currentHp": 40,
            "maxHp": 40,
            "states": [],
            "hasActedThisTurn": false,
            "status": "active",
            "skills": [
              {
                "name": "殴打",
                "detail": ""
              },
              {
                "name": "ビルドアップ",
                "detail": "打点上昇し、次のターンからの攻撃力を高める"
              }
            ],
            "plannedActions": [
              {
                "turn": 1,
                "actionName": "殴打",
                "actionType": "attack"
              }
            ]
          },
          {
            "id": 1,
            "name": "オークダンサー",
            "image": "/assets/enemies/orc-dancer.jpg",
            "currentHp": 40,
            "maxHp": 40,
            "states": [],
            "hasActedThisTurn": false,
            "status": "active",
            "skills": [
              {
                "name": "突き刺す",
                "detail": "ふつうの連続攻撃"
              },
              {
                "name": "戦いの舞い",
                "detail": "加速し、次のターンから攻撃回数を増やす"
              }
            ],
            "plannedActions": [
              {
                "turn": 1,
                "actionName": "戦いの舞い",
                "actionType": "skill"
              }
            ]
          },
          {
            "id": 2,
            "name": "触手",
            "image": "",
            "currentHp": 25,
            "maxHp": 25,
            "states": [],
            "hasActedThisTurn": false,
            "status": "active",
            "skills": [
              {
                "name": "突き刺す",
                "detail": "ふつうの連続攻撃"
              },
              {
                "name": "体液をかける",
                "detail": ""
              }
            ],
            "plannedActions": [
              {
                "turn": 1,
                "actionName": "体液をかける",
                "actionType": "attack"
              }
            ]
          },
          {
            "id": 3,
            "name": "かたつむり",
            "image": "/assets/enemies/snail.jpg",
            "currentHp": 10,
            "maxHp": 10,
            "states": [
              {
                "id": "state-hard-shell",
                "name": "鉄壁",
                "description": "攻撃を受ける時、打点-<magnitude>20</magnitude>",
                "category": "trait",
                "isImportant": true,
                "stackable": true,
                "magnitude": 20
              }
            ],
            "hasActedThisTurn": false,
            "status": "active",
            "skills": [
              {
                "name": "殴打",
                "detail": ""
              },
              {
                "name": "溶かす",
                "detail": "対象に腐食10点を付与する"
              }
            ],
            "plannedActions": [
              {
                "turn": 1,
                "actionName": "溶かす",
                "actionType": "attack"
              }
            ]
          }
        ],
        "deck": [
          {
            "idValue": 7,
            "actionRef": {
              "props": {
                "name": "日課",
                "cardDefinition": {
                  "title": "日課",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-self",
                      "name": "自身",
                      "description": "使用者自身に効果を及ぼすカード"
                    },
                    "target": "self"
                  },
                  "cost": 1,
                  "subtitle": "祈り"
                }
              },
              "gainStateFactories": []
            },
            "definitionValue": {
              "title": "日課",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-self",
                  "name": "自身",
                  "description": "使用者自身に効果を及ぼすカード"
                },
                "target": "self"
              },
              "cost": 1,
              "subtitle": "祈り"
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 2,
            "actionRef": {
              "props": {
                "name": "天の鎖",
                "cardDefinition": {
                  "title": "天の鎖",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "祈り",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-sacred",
                        "name": "神聖",
                        "description": "暴力を許さぬ、癒しと守りの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/HeavenChainAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "天の鎖",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "祈り",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-sacred",
                    "name": "神聖",
                    "description": "暴力を許さぬ、癒しと守りの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 8,
            "actionRef": {
              "props": {
                "name": "疼き",
                "cardDefinition": {
                  "title": "疼き",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-self",
                      "name": "自身",
                      "description": "使用者自身に効果を及ぼすカード"
                    },
                    "target": "self"
                  },
                  "cost": 1,
                  "subtitle": "",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-arcane",
                        "name": "魔",
                        "description": "痛みと傷に惹かれるモノたちの力"
                      }
                    }
                  ]
                }
              },
              "gainStateFactories": []
            },
            "definitionValue": {
              "title": "疼き",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-self",
                  "name": "自身",
                  "description": "使用者自身に効果を及ぼすカード"
                },
                "target": "self"
              },
              "cost": 1,
              "subtitle": "",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-arcane",
                    "name": "魔",
                    "description": "痛みと傷に惹かれるモノたちの力"
                  }
                }
              ],
              "operations": [
                "select-hand-card"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 5,
            "actionRef": {
              "props": {
                "name": "被虐のオーラ",
                "cardDefinition": {
                  "title": "被虐のオーラ",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "",
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-arcane",
                        "name": "魔",
                        "description": "痛みと傷に惹かれるモノたちの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/MasochisticAuraAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/MasochisticAuraAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "被虐のオーラ",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "",
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-arcane",
                    "name": "魔",
                    "description": "痛みと傷に惹かれるモノたちの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 3,
            "actionRef": {
              "props": {
                "name": "天の鎖",
                "cardDefinition": {
                  "title": "天の鎖",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "祈り",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-sacred",
                        "name": "神聖",
                        "description": "暴力を許さぬ、癒しと守りの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/HeavenChainAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "天の鎖",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "祈り",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-sacred",
                    "name": "神聖",
                    "description": "暴力を許さぬ、癒しと守りの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": []
          }
        ],
        "hand": [],
        "discardPile": [
          {
            "idValue": 0,
            "actionRef": {
              "props": {
                "name": "天の鎖",
                "cardDefinition": {
                  "title": "天の鎖",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "祈り",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-sacred",
                        "name": "神聖",
                        "description": "暴力を許さぬ、癒しと守りの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/HeavenChainAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "天の鎖",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "祈り",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-sacred",
                    "name": "神聖",
                    "description": "暴力を許さぬ、癒しと守りの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 1,
            "actionRef": {
              "props": {
                "name": "天の鎖",
                "cardDefinition": {
                  "title": "天の鎖",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "祈り",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-sacred",
                        "name": "神聖",
                        "description": "暴力を許さぬ、癒しと守りの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/HeavenChainAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "天の鎖",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "祈り",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-sacred",
                    "name": "神聖",
                    "description": "暴力を許さぬ、癒しと守りの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 6,
            "actionRef": {
              "props": {
                "name": "戦いの準備",
                "cardDefinition": {
                  "title": "戦いの準備",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-self",
                      "name": "自身",
                      "description": "使用者自身に効果を及ぼすカード"
                    },
                    "target": "self"
                  },
                  "cost": 1,
                  "subtitle": ""
                }
              },
              "gainStateFactories": []
            },
            "definitionValue": {
              "title": "戦いの準備",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-self",
                  "name": "自身",
                  "description": "使用者自身に効果を及ぼすカード"
                },
                "target": "self"
              },
              "cost": 1,
              "subtitle": ""
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 4,
            "actionRef": {
              "props": {
                "name": "被虐のオーラ",
                "cardDefinition": {
                  "title": "被虐のオーラ",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "",
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-arcane",
                        "name": "魔",
                        "description": "痛みと傷に惹かれるモノたちの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/MasochisticAuraAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/MasochisticAuraAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "被虐のオーラ",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "",
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-arcane",
                    "name": "魔",
                    "description": "痛みと傷に惹かれるモノたちの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          }
        ],
        "exilePile": [],
        "events": [],
        "turn": {
          "turnCount": 1,
          "activeSide": "player",
          "phase": "player-end"
        },
        "log": [],
        "status": "in-progress"
      },
      "patch": {
        "changes": {
          "player": {
            "id": "player-1",
            "name": "聖女",
            "currentHp": 150,
            "maxHp": 150,
            "currentMana": 3,
            "maxMana": 3,
            "relics": [],
            "states": []
          },
          "hand": [],
          "deck": [
            {
              "idValue": 7,
              "actionRef": {
                "props": {
                  "name": "日課",
                  "cardDefinition": {
                    "title": "日課",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-self",
                        "name": "自身",
                        "description": "使用者自身に効果を及ぼすカード"
                      },
                      "target": "self"
                    },
                    "cost": 1,
                    "subtitle": "祈り"
                  }
                },
                "gainStateFactories": []
              },
              "definitionValue": {
                "title": "日課",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-self",
                    "name": "自身",
                    "description": "使用者自身に効果を及ぼすカード"
                  },
                  "target": "self"
                },
                "cost": 1,
                "subtitle": "祈り"
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 2,
              "actionRef": {
                "props": {
                  "name": "天の鎖",
                  "cardDefinition": {
                    "title": "天の鎖",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "祈り",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-sacred",
                          "name": "神聖",
                          "description": "暴力を許さぬ、癒しと守りの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/HeavenChainAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "天の鎖",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "祈り",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-sacred",
                      "name": "神聖",
                      "description": "暴力を許さぬ、癒しと守りの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 8,
              "actionRef": {
                "props": {
                  "name": "疼き",
                  "cardDefinition": {
                    "title": "疼き",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-self",
                        "name": "自身",
                        "description": "使用者自身に効果を及ぼすカード"
                      },
                      "target": "self"
                    },
                    "cost": 1,
                    "subtitle": "",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-arcane",
                          "name": "魔",
                          "description": "痛みと傷に惹かれるモノたちの力"
                        }
                      }
                    ]
                  }
                },
                "gainStateFactories": []
              },
              "definitionValue": {
                "title": "疼き",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-self",
                    "name": "自身",
                    "description": "使用者自身に効果を及ぼすカード"
                  },
                  "target": "self"
                },
                "cost": 1,
                "subtitle": "",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-arcane",
                      "name": "魔",
                      "description": "痛みと傷に惹かれるモノたちの力"
                    }
                  }
                ],
                "operations": [
                  "select-hand-card"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 5,
              "actionRef": {
                "props": {
                  "name": "被虐のオーラ",
                  "cardDefinition": {
                    "title": "被虐のオーラ",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "",
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-arcane",
                          "name": "魔",
                          "description": "痛みと傷に惹かれるモノたちの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/MasochisticAuraAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/MasochisticAuraAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "被虐のオーラ",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "",
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-arcane",
                      "name": "魔",
                      "description": "痛みと傷に惹かれるモノたちの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 3,
              "actionRef": {
                "props": {
                  "name": "天の鎖",
                  "cardDefinition": {
                    "title": "天の鎖",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "祈り",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-sacred",
                          "name": "神聖",
                          "description": "暴力を許さぬ、癒しと守りの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/HeavenChainAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "天の鎖",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "祈り",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-sacred",
                      "name": "神聖",
                      "description": "暴力を許さぬ、癒しと守りの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": []
            }
          ],
          "discardPile": [
            {
              "idValue": 0,
              "actionRef": {
                "props": {
                  "name": "天の鎖",
                  "cardDefinition": {
                    "title": "天の鎖",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "祈り",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-sacred",
                          "name": "神聖",
                          "description": "暴力を許さぬ、癒しと守りの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/HeavenChainAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "天の鎖",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "祈り",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-sacred",
                      "name": "神聖",
                      "description": "暴力を許さぬ、癒しと守りの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 1,
              "actionRef": {
                "props": {
                  "name": "天の鎖",
                  "cardDefinition": {
                    "title": "天の鎖",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "祈り",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-sacred",
                          "name": "神聖",
                          "description": "暴力を許さぬ、癒しと守りの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/HeavenChainAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "天の鎖",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "祈り",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-sacred",
                      "name": "神聖",
                      "description": "暴力を許さぬ、癒しと守りの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 6,
              "actionRef": {
                "props": {
                  "name": "戦いの準備",
                  "cardDefinition": {
                    "title": "戦いの準備",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-self",
                        "name": "自身",
                        "description": "使用者自身に効果を及ぼすカード"
                      },
                      "target": "self"
                    },
                    "cost": 1,
                    "subtitle": ""
                  }
                },
                "gainStateFactories": []
              },
              "definitionValue": {
                "title": "戦いの準備",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-self",
                    "name": "自身",
                    "description": "使用者自身に効果を及ぼすカード"
                  },
                  "target": "self"
                },
                "cost": 1,
                "subtitle": ""
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 4,
              "actionRef": {
                "props": {
                  "name": "被虐のオーラ",
                  "cardDefinition": {
                    "title": "被虐のオーラ",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "",
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-arcane",
                          "name": "魔",
                          "description": "痛みと傷に惹かれるモノたちの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/MasochisticAuraAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/MasochisticAuraAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "被虐のオーラ",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "",
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-arcane",
                      "name": "魔",
                      "description": "痛みと傷に惹かれるモノたちの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            }
          ],
          "exilePile": []
        }
      },
      "instructions": [
        {
          "waitMs": 0,
          "metadata": {
            "stage": "turn-end"
          }
        }
      ]
    },
    {
      "batchId": "card-trash:3",
      "snapshot": {
        "id": "battle-1",
        "player": {
          "id": "player-1",
          "name": "聖女",
          "currentHp": 150,
          "maxHp": 150,
          "currentMana": 3,
          "maxMana": 3,
          "states": []
        },
        "enemies": [
          {
            "id": 0,
            "name": "オーク",
            "image": "/assets/enemies/orc.jpg",
            "currentHp": 40,
            "maxHp": 40,
            "states": [],
            "hasActedThisTurn": false,
            "status": "active",
            "skills": [
              {
                "name": "殴打",
                "detail": ""
              },
              {
                "name": "ビルドアップ",
                "detail": "打点上昇し、次のターンからの攻撃力を高める"
              }
            ],
            "plannedActions": [
              {
                "turn": 1,
                "actionName": "殴打",
                "actionType": "attack"
              }
            ]
          },
          {
            "id": 1,
            "name": "オークダンサー",
            "image": "/assets/enemies/orc-dancer.jpg",
            "currentHp": 40,
            "maxHp": 40,
            "states": [],
            "hasActedThisTurn": false,
            "status": "active",
            "skills": [
              {
                "name": "突き刺す",
                "detail": "ふつうの連続攻撃"
              },
              {
                "name": "戦いの舞い",
                "detail": "加速し、次のターンから攻撃回数を増やす"
              }
            ],
            "plannedActions": [
              {
                "turn": 1,
                "actionName": "戦いの舞い",
                "actionType": "skill"
              }
            ]
          },
          {
            "id": 2,
            "name": "触手",
            "image": "",
            "currentHp": 25,
            "maxHp": 25,
            "states": [],
            "hasActedThisTurn": false,
            "status": "active",
            "skills": [
              {
                "name": "突き刺す",
                "detail": "ふつうの連続攻撃"
              },
              {
                "name": "体液をかける",
                "detail": ""
              }
            ],
            "plannedActions": [
              {
                "turn": 1,
                "actionName": "体液をかける",
                "actionType": "attack"
              }
            ]
          },
          {
            "id": 3,
            "name": "かたつむり",
            "image": "/assets/enemies/snail.jpg",
            "currentHp": 10,
            "maxHp": 10,
            "states": [
              {
                "id": "state-hard-shell",
                "name": "鉄壁",
                "description": "攻撃を受ける時、打点-<magnitude>20</magnitude>",
                "category": "trait",
                "isImportant": true,
                "stackable": true,
                "magnitude": 20
              }
            ],
            "hasActedThisTurn": false,
            "status": "active",
            "skills": [
              {
                "name": "殴打",
                "detail": ""
              },
              {
                "name": "溶かす",
                "detail": "対象に腐食10点を付与する"
              }
            ],
            "plannedActions": [
              {
                "turn": 1,
                "actionName": "溶かす",
                "actionType": "attack"
              }
            ]
          }
        ],
        "deck": [
          {
            "idValue": 7,
            "actionRef": {
              "props": {
                "name": "日課",
                "cardDefinition": {
                  "title": "日課",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-self",
                      "name": "自身",
                      "description": "使用者自身に効果を及ぼすカード"
                    },
                    "target": "self"
                  },
                  "cost": 1,
                  "subtitle": "祈り"
                }
              },
              "gainStateFactories": []
            },
            "definitionValue": {
              "title": "日課",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-self",
                  "name": "自身",
                  "description": "使用者自身に効果を及ぼすカード"
                },
                "target": "self"
              },
              "cost": 1,
              "subtitle": "祈り"
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 2,
            "actionRef": {
              "props": {
                "name": "天の鎖",
                "cardDefinition": {
                  "title": "天の鎖",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "祈り",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-sacred",
                        "name": "神聖",
                        "description": "暴力を許さぬ、癒しと守りの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/HeavenChainAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "天の鎖",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "祈り",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-sacred",
                    "name": "神聖",
                    "description": "暴力を許さぬ、癒しと守りの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 8,
            "actionRef": {
              "props": {
                "name": "疼き",
                "cardDefinition": {
                  "title": "疼き",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-self",
                      "name": "自身",
                      "description": "使用者自身に効果を及ぼすカード"
                    },
                    "target": "self"
                  },
                  "cost": 1,
                  "subtitle": "",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-arcane",
                        "name": "魔",
                        "description": "痛みと傷に惹かれるモノたちの力"
                      }
                    }
                  ]
                }
              },
              "gainStateFactories": []
            },
            "definitionValue": {
              "title": "疼き",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-self",
                  "name": "自身",
                  "description": "使用者自身に効果を及ぼすカード"
                },
                "target": "self"
              },
              "cost": 1,
              "subtitle": "",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-arcane",
                    "name": "魔",
                    "description": "痛みと傷に惹かれるモノたちの力"
                  }
                }
              ],
              "operations": [
                "select-hand-card"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 5,
            "actionRef": {
              "props": {
                "name": "被虐のオーラ",
                "cardDefinition": {
                  "title": "被虐のオーラ",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "",
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-arcane",
                        "name": "魔",
                        "description": "痛みと傷に惹かれるモノたちの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/MasochisticAuraAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/MasochisticAuraAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "被虐のオーラ",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "",
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-arcane",
                    "name": "魔",
                    "description": "痛みと傷に惹かれるモノたちの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 3,
            "actionRef": {
              "props": {
                "name": "天の鎖",
                "cardDefinition": {
                  "title": "天の鎖",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "祈り",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-sacred",
                        "name": "神聖",
                        "description": "暴力を許さぬ、癒しと守りの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/HeavenChainAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "天の鎖",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "祈り",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-sacred",
                    "name": "神聖",
                    "description": "暴力を許さぬ、癒しと守りの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": []
          }
        ],
        "hand": [],
        "discardPile": [
          {
            "idValue": 0,
            "actionRef": {
              "props": {
                "name": "天の鎖",
                "cardDefinition": {
                  "title": "天の鎖",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "祈り",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-sacred",
                        "name": "神聖",
                        "description": "暴力を許さぬ、癒しと守りの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/HeavenChainAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "天の鎖",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "祈り",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-sacred",
                    "name": "神聖",
                    "description": "暴力を許さぬ、癒しと守りの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 1,
            "actionRef": {
              "props": {
                "name": "天の鎖",
                "cardDefinition": {
                  "title": "天の鎖",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "祈り",
                  "effectTags": [
                    {
                      "props": {
                        "id": "tag-exhaust",
                        "name": "消滅",
                        "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                      }
                    }
                  ],
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-sacred",
                        "name": "神聖",
                        "description": "暴力を許さぬ、癒しと守りの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/HeavenChainAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "天の鎖",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "祈り",
              "effectTags": [
                {
                  "props": {
                    "id": "tag-exhaust",
                    "name": "消滅",
                    "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                  }
                }
              ],
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-sacred",
                    "name": "神聖",
                    "description": "暴力を許さぬ、癒しと守りの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 6,
            "actionRef": {
              "props": {
                "name": "戦いの準備",
                "cardDefinition": {
                  "title": "戦いの準備",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-self",
                      "name": "自身",
                      "description": "使用者自身に効果を及ぼすカード"
                    },
                    "target": "self"
                  },
                  "cost": 1,
                  "subtitle": ""
                }
              },
              "gainStateFactories": []
            },
            "definitionValue": {
              "title": "戦いの準備",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-self",
                  "name": "自身",
                  "description": "使用者自身に効果を及ぼすカード"
                },
                "target": "self"
              },
              "cost": 1,
              "subtitle": ""
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          },
          {
            "idValue": 4,
            "actionRef": {
              "props": {
                "name": "被虐のオーラ",
                "cardDefinition": {
                  "title": "被虐のオーラ",
                  "cardType": "skill",
                  "type": {
                    "props": {
                      "id": "tag-type-skill",
                      "name": "スキル",
                      "description": "技を発動するカード"
                    },
                    "cardType": "skill"
                  },
                  "target": {
                    "props": {
                      "id": "tag-target-enemy-single",
                      "name": "敵一体",
                      "description": "敵を1体対象とする"
                    },
                    "target": "enemy-single"
                  },
                  "cost": 1,
                  "subtitle": "",
                  "categoryTags": [
                    {
                      "props": {
                        "id": "tag-arcane",
                        "name": "魔",
                        "description": "痛みと傷に惹かれるモノたちの力"
                      }
                    }
                  ]
                },
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/MasochisticAuraAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "gainStateFactories": [],
              "audioCue": {
                "soundId": "skills/Onoma-Flash02.mp3",
                "waitMs": 500,
                "durationMs": 500
              },
              "cutInCue": {
                "src": "/assets/cut_ins/MasochisticAuraAction.png",
                "waitMs": 800,
                "durationMs": 800
              }
            },
            "definitionValue": {
              "title": "被虐のオーラ",
              "cardType": "skill",
              "type": {
                "props": {
                  "id": "tag-type-skill",
                  "name": "スキル",
                  "description": "技を発動するカード"
                },
                "cardType": "skill"
              },
              "target": {
                "props": {
                  "id": "tag-target-enemy-single",
                  "name": "敵一体",
                  "description": "敵を1体対象とする"
                },
                "target": "enemy-single"
              },
              "cost": 1,
              "subtitle": "",
              "categoryTags": [
                {
                  "props": {
                    "id": "tag-arcane",
                    "name": "魔",
                    "description": "痛みと傷に惹かれるモノたちの力"
                  }
                }
              ],
              "operations": [
                "target-enemy"
              ]
            },
            "extraTags": [],
            "extraCategoryTags": [],
            "runtimeCost": 1,
            "runtimeActive": true
          }
        ],
        "exilePile": [],
        "events": [],
        "turn": {
          "turnCount": 1,
          "activeSide": "player",
          "phase": "player-end"
        },
        "log": [],
        "status": "in-progress"
      },
      "patch": {
        "changes": {
          "player": {
            "id": "player-1",
            "name": "聖女",
            "currentHp": 150,
            "maxHp": 150,
            "currentMana": 3,
            "maxMana": 3,
            "relics": [],
            "states": []
          },
          "hand": [],
          "deck": [
            {
              "idValue": 7,
              "actionRef": {
                "props": {
                  "name": "日課",
                  "cardDefinition": {
                    "title": "日課",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-self",
                        "name": "自身",
                        "description": "使用者自身に効果を及ぼすカード"
                      },
                      "target": "self"
                    },
                    "cost": 1,
                    "subtitle": "祈り"
                  }
                },
                "gainStateFactories": []
              },
              "definitionValue": {
                "title": "日課",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-self",
                    "name": "自身",
                    "description": "使用者自身に効果を及ぼすカード"
                  },
                  "target": "self"
                },
                "cost": 1,
                "subtitle": "祈り"
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 2,
              "actionRef": {
                "props": {
                  "name": "天の鎖",
                  "cardDefinition": {
                    "title": "天の鎖",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "祈り",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-sacred",
                          "name": "神聖",
                          "description": "暴力を許さぬ、癒しと守りの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/HeavenChainAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "天の鎖",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "祈り",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-sacred",
                      "name": "神聖",
                      "description": "暴力を許さぬ、癒しと守りの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 8,
              "actionRef": {
                "props": {
                  "name": "疼き",
                  "cardDefinition": {
                    "title": "疼き",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-self",
                        "name": "自身",
                        "description": "使用者自身に効果を及ぼすカード"
                      },
                      "target": "self"
                    },
                    "cost": 1,
                    "subtitle": "",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-arcane",
                          "name": "魔",
                          "description": "痛みと傷に惹かれるモノたちの力"
                        }
                      }
                    ]
                  }
                },
                "gainStateFactories": []
              },
              "definitionValue": {
                "title": "疼き",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-self",
                    "name": "自身",
                    "description": "使用者自身に効果を及ぼすカード"
                  },
                  "target": "self"
                },
                "cost": 1,
                "subtitle": "",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-arcane",
                      "name": "魔",
                      "description": "痛みと傷に惹かれるモノたちの力"
                    }
                  }
                ],
                "operations": [
                  "select-hand-card"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 5,
              "actionRef": {
                "props": {
                  "name": "被虐のオーラ",
                  "cardDefinition": {
                    "title": "被虐のオーラ",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "",
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-arcane",
                          "name": "魔",
                          "description": "痛みと傷に惹かれるモノたちの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/MasochisticAuraAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/MasochisticAuraAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "被虐のオーラ",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "",
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-arcane",
                      "name": "魔",
                      "description": "痛みと傷に惹かれるモノたちの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 3,
              "actionRef": {
                "props": {
                  "name": "天の鎖",
                  "cardDefinition": {
                    "title": "天の鎖",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "祈り",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-sacred",
                          "name": "神聖",
                          "description": "暴力を許さぬ、癒しと守りの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/HeavenChainAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "天の鎖",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "祈り",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-sacred",
                      "name": "神聖",
                      "description": "暴力を許さぬ、癒しと守りの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": []
            }
          ],
          "discardPile": [
            {
              "idValue": 0,
              "actionRef": {
                "props": {
                  "name": "天の鎖",
                  "cardDefinition": {
                    "title": "天の鎖",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "祈り",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-sacred",
                          "name": "神聖",
                          "description": "暴力を許さぬ、癒しと守りの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/HeavenChainAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "天の鎖",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "祈り",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-sacred",
                      "name": "神聖",
                      "description": "暴力を許さぬ、癒しと守りの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 1,
              "actionRef": {
                "props": {
                  "name": "天の鎖",
                  "cardDefinition": {
                    "title": "天の鎖",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "祈り",
                    "effectTags": [
                      {
                        "props": {
                          "id": "tag-exhaust",
                          "name": "消滅",
                          "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                        }
                      }
                    ],
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-sacred",
                          "name": "神聖",
                          "description": "暴力を許さぬ、癒しと守りの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/HeavenChainAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/HeavenChainAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "天の鎖",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "祈り",
                "effectTags": [
                  {
                    "props": {
                      "id": "tag-exhaust",
                      "name": "消滅",
                      "description": "使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。"
                    }
                  }
                ],
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-sacred",
                      "name": "神聖",
                      "description": "暴力を許さぬ、癒しと守りの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 6,
              "actionRef": {
                "props": {
                  "name": "戦いの準備",
                  "cardDefinition": {
                    "title": "戦いの準備",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-self",
                        "name": "自身",
                        "description": "使用者自身に効果を及ぼすカード"
                      },
                      "target": "self"
                    },
                    "cost": 1,
                    "subtitle": ""
                  }
                },
                "gainStateFactories": []
              },
              "definitionValue": {
                "title": "戦いの準備",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-self",
                    "name": "自身",
                    "description": "使用者自身に効果を及ぼすカード"
                  },
                  "target": "self"
                },
                "cost": 1,
                "subtitle": ""
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            },
            {
              "idValue": 4,
              "actionRef": {
                "props": {
                  "name": "被虐のオーラ",
                  "cardDefinition": {
                    "title": "被虐のオーラ",
                    "cardType": "skill",
                    "type": {
                      "props": {
                        "id": "tag-type-skill",
                        "name": "スキル",
                        "description": "技を発動するカード"
                      },
                      "cardType": "skill"
                    },
                    "target": {
                      "props": {
                        "id": "tag-target-enemy-single",
                        "name": "敵一体",
                        "description": "敵を1体対象とする"
                      },
                      "target": "enemy-single"
                    },
                    "cost": 1,
                    "subtitle": "",
                    "categoryTags": [
                      {
                        "props": {
                          "id": "tag-arcane",
                          "name": "魔",
                          "description": "痛みと傷に惹かれるモノたちの力"
                        }
                      }
                    ]
                  },
                  "audioCue": {
                    "soundId": "skills/Onoma-Flash02.mp3",
                    "waitMs": 500,
                    "durationMs": 500
                  },
                  "cutInCue": {
                    "src": "/assets/cut_ins/MasochisticAuraAction.png",
                    "waitMs": 800,
                    "durationMs": 800
                  }
                },
                "gainStateFactories": [],
                "audioCue": {
                  "soundId": "skills/Onoma-Flash02.mp3",
                  "waitMs": 500,
                  "durationMs": 500
                },
                "cutInCue": {
                  "src": "/assets/cut_ins/MasochisticAuraAction.png",
                  "waitMs": 800,
                  "durationMs": 800
                }
              },
              "definitionValue": {
                "title": "被虐のオーラ",
                "cardType": "skill",
                "type": {
                  "props": {
                    "id": "tag-type-skill",
                    "name": "スキル",
                    "description": "技を発動するカード"
                  },
                  "cardType": "skill"
                },
                "target": {
                  "props": {
                    "id": "tag-target-enemy-single",
                    "name": "敵一体",
                    "description": "敵を1体対象とする"
                  },
                  "target": "enemy-single"
                },
                "cost": 1,
                "subtitle": "",
                "categoryTags": [
                  {
                    "props": {
                      "id": "tag-arcane",
                      "name": "魔",
                      "description": "痛みと傷に惹かれるモノたちの力"
                    }
                  }
                ],
                "operations": [
                  "target-enemy"
                ]
              },
              "extraTags": [],
              "extraCategoryTags": [],
              "runtimeCost": 1,
              "runtimeActive": true
            }
          ],
          "exilePile": []
        }
      },
      "instructions": [
        {
          "waitMs": 600,
          "metadata": {
            "stage": "card-trash",
            "cardIds": [
              0,
              1,
              6,
              4
            ],
            "cardTitles": [
              "天の鎖",
              "天の鎖",
              "戦いの準備",
              "被虐のオーラ"
            ]
          }
        }
      ]
    }
  ]
}
