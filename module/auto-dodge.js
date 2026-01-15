const MODULE_ID = "auto-dodge";

Hooks.once("init", () => {
  console.log("Auto Dodge | init");

  // Перехватываем refresh()
  const originalRefresh = GURPS.ModifierBucket.refresh.bind(GURPS.ModifierBucket);

  GURPS.ModifierBucket.refresh = function() {
    // Вызываем хук перед обновлением
    Hooks.callAll('gurps.modifierBucketRefresh', {
      modifierList: this.modifierStack.modifierList,
      currentSum: this.modifierStack.currentSum
    });
    
    return originalRefresh();
  };

  Hooks.on('gurps.modifierBucketRefresh', async (data) => {
    await sleep(400);
    console.log('variable ModifierList updated from ModifierBucket');
    modifierList = GURPS.ModifierBucket?.modifierStack?.modifierList ?? [];
  });
});



function registerSettings() {
	game.settings.register("auto-dodge", "test_option", {
    name: "auto-dodge.options.test_option.name",
    hint: "auto-dodge.options.test_option.hint"
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

let modifierList = []

async function autoDodge(token) {
  if (!token?.actor) return;

  const tagged_prevoius_value = game.settings.get("gurps", "use-tagged-modifiers");
  const confirmation_prevoius_value = game.settings.get("gurps", "show-confirmation-roll-dialog");

  if (confirmation_prevoius_value === true) {
    game.settings.set("gurps", "use-tagged-modifiers", false);
    await sleep(200);
    game.settings.set("gurps", "show-confirmation-roll-dialog", false);
  }

  let defence_penalty = "0";
  const deceptive_attack = modifierList.find(modifier => modifier?.desc?.includes("Deceptive Attack"))
  const deceptive_modifier = deceptive_attack ? Number(deceptive_attack.mod) : 0
  if(deceptive_modifier < 0) {
    defence_penalty = String(Math.trunc((deceptive_modifier || 0) / 2));
  }

  GURPS.actionFuncs.attribute({
    action: {
      type: 'attribute',
      name: 'Dodge',
      attribute: 'Dodge',
      attrkey: 'DODGE',
      path: 'currentdodge',  // Путь к значению в actor.system
      mod: defence_penalty,              // Модификатор (опционально)
      // desc: 'stunned',        // Описание (опционально)
      blindroll: false       // Слепой бросок (опционально)
      // target: null            // Если указано, используется это значение вместо actor.system.currentdodge
    },
    actor: game.actors.get(token?.actor?.id),
    event: null,
    originalOtf: 'Dodge',
    calcOnly: false
  });

  if (confirmation_prevoius_value === true) {
    await sleep(300);
    game.settings.set("gurps", "show-confirmation-roll-dialog", true);
    await sleep(200);
    game.settings.set("gurps", "use-tagged-modifiers", tagged_prevoius_value);
  }
}

Hooks.on("createChatMessage", (msg) => {
  console.group("=== Auto Dodge | ChatMessage ===");

  if (msg.isRoll) {
    console.log("Rolls:", msg.rolls);
    console.log("Roll Flavor:", msg.flavor);
    console.log("System Flags:", msg.flags?.gurps);
  }

  if (msg.user?.id === game.user.id && msg.rolls?.[0]?._formula?.includes("Attack") ) {
    const token = [...game.user.targets][0];
    if (token) {
      autoDodge(token);
    }
  }
    
  console.log("All Flags:", msg.flags);

  console.groupEnd();
});

