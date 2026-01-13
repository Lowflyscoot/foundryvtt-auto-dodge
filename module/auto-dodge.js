const MODULE_ID = "auto-dodge";

Hooks.once("init", () => {
  console.log("Auto Dodge | init");
});

game.settings.register("auto-dodge", "test_option", {
  name: "auto-dodge.options.test_option.name",
  hint: "auto-dodge.options.test_option.hint"
});