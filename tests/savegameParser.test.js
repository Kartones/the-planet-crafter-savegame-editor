import test from "node:test";
import assert from "node:assert/strict";
import { parseSavegame } from "../js/savegameParser.mjs";

const exampleContent = `{"unitOxygenLevel":1.2,"unitHeatLevel":1.2,"unitPressureLevel":1.2,"unitPlantsLevel":0.0,"unitInsectsLevel":0.0,"unitAnimalsLevel":0.0,"terraTokens":0,"allTimeTerraTokens":0,"unlockedGroups":"BootsSpeed1","openedInstanceSeed":0,"openedInstanceTimeLeft":0}@{"id":76561197987342492,"name":"Kartones","inventoryId":3,"equipmentId":4,"playerPosition":"343.5337,61.57998,743.443","playerRotation":"0,-0.9953345,0,0.09648436","playerGaugeOxygen":100.0,"playerGaugeThirst":100.0,"playerGaugeHealth":100.0,"host":true}@@`;

test("parseSavegame parses all sections correctly", () => {
  const result = parseSavegame(exampleContent);

  assert.ok(result.section0, "Section 0 should exist");
  assert.ok(result.section1, "Section 1 should exist");
  assert.ok(result.section2 === null, "Section 2, if exists, should be null");

  assert.equal(
    result.section0.unitOxygenLevel,
    1.2,
    "Section 0 should have unitOxygenLevel of 1.2"
  );
  assert.equal(
    result.section1.name,
    "Kartones",
    'Section 1 should have name "Kartones"'
  );
});
