export const recovery = `
Walking cooldown|Cooldown|active|Locomotion|1|After general activity, walk easily and let the pace settle. Finish before this becomes another conditioning session.
Cycling cooldown|Cooldown|active|Locomotion|1|Use a stationary cycle at easy resistance after activity. Slow the pedals before dismounting; effort should remain comfortable.
Quiet standing transition|Cooldown|relax|Recovery|0|After an easy cooldown, stand in a supported comfortable position and let breathing settle naturally. Sit if standing feels unsteady.
Easy recovery walk|Active recovery|active|Locomotion|1|Choose a short familiar route and walk without chasing distance or pace. Rest is also a valid choice when activity feels burdensome.
Easy stationary cycling|Low-intensity aerobic recovery|aerobic|Aerobic Endurance|1|Set the cycle for comfortable easy pedaling. Keep resistance low enough that conversation feels effortless and stop before fatigue builds.
Gentle whole-body movement break|Active recovery|active|Recovery|1|After prolonged sitting, stand and move comfortably through familiar arm and leg motions. Keep this a break rather than a workout.
Comfortable calf stretch|Mobility|mobility|Mobility|1|Face a wall with one leg behind and heel down. Shift forward gently, release, and change sides without bouncing.
Seated hamstring reach|Mobility|mobility|Mobility|1|Sit on a stable seat with one leg extended comfortably. Incline slightly from the hips, then return without pulling on the leg.
Gentle chest opening|Mobility|mobility|Mobility|1|Stand with arms relaxed and gently open them to the sides. Keep ribs quiet and stop before shoulder discomfort.
Supported hip-flexor position|Mobility|mobility|Mobility|1|Use a supported staggered stance and shift the pelvis slightly forward. Keep the trunk upright; no forced stretch or kneeling is required.
Supine relaxation pause|Breathing and downregulation|relax|Recovery|0|Lie comfortably with knees supported as needed. Notice normal breathing without trying to hold the breath or achieve a fixed rhythm.
Seated breathing pause|Breathing and downregulation|relax|Recovery|0|Sit supported and let breathing become comfortable. Avoid forceful deep breaths; return to ordinary breathing if lightheaded.
Quiet attention reset|Breathing and downregulation|relax|Recovery|0|Choose a quiet place and notice contact with the seat or floor. Allow attention to return gently when distracted.
Sleep opportunity planning|Sleep education|sleep|Recovery|0|Protect a realistic sleep window around existing responsibilities. Record obstacles for discussion; this is habit education, not treatment for a sleep disorder.
Consistent wind-down cue|Sleep education|sleep|Recovery|0|Choose a simple repeatable cue that marks the end of the day. Keep it practical enough to repeat without turning it into another obligation.
Sleep environment check|Sleep education|sleep|Recovery|0|Review light, noise and comfort in the sleep space. Make feasible adjustments while respecting safety and household needs.
Post-activity drink access|Hydration education|hydration|Recovery|0|Make drinks available after activity and sip comfortably. Needs vary with conditions; do not use a fixed universal volume or force rapid drinking.
Heat-day hydration preparation|Hydration education|hydration|Recovery|0|Before a hot day, identify drinking-water access and cooling opportunities. Follow applicable local heat guidance; this note does not treat heat illness.
Hydration context reflection|Hydration education|hydration|Recovery|0|Notice how weather, clothing and activity change thirst and drinking access. Discuss persistent concerns with a qualified professional rather than self-diagnosing from one sign.
Ordinary-food recovery meal|Performance nutrition education|nutrition|Recovery|0|Plan an ordinary meal with carbohydrate and protein foods that fit preferences and tolerances. No special recovery product is required.
Portable recovery food planning|Performance nutrition education|nutrition|Recovery|0|When meals are inconvenient, identify a practical snack option and safe storage. Account for allergies and food-safety needs without imposing a therapeutic diet.
Food access after a long day|Performance nutrition education|nutrition|Recovery|0|Check that a meal and drinks will be available after a demanding day. Planning access is the goal; calories and portions are not prescribed.
Reduced-volume discussion|Deload education|deload|Recovery|0|Discuss an easier training period with the responsible coach when recovery is difficult. Do not add missed work elsewhere or self-diagnose overtraining.
Rest-day permission|Deload education|deload|Recovery|0|Treat a planned rest day as part of training. Persistent fatigue or other concerns deserve qualified assessment, not an automatic exercise adjustment.
Post-run walking transition|Post-run recovery|active|Running|1|After running, ease into a comfortable walk on safe ground. Stop if discomfort develops rather than using more movement to push through it.
Post-run comfort check|Post-run recovery|mobility|Running|0|After settling, notice whether usual easy movement feels comfortable. Avoid aggressive stretching or using this check to diagnose an injury.
Post-ruck unload and settle|Post-ruck recovery|ruck|Rucking|0|Stop on stable ground and remove the pack deliberately. Check contact areas and restore ordinary posture without turning recovery into another loaded walk.
Post-ruck next-day discussion|Post-ruck recovery|ruck|Rucking|0|Consider the previous loaded effort when discussing the next session with a coach. New numbness or persistent pain needs qualified attention.
Post-high-intensity downshift|Post-high-intensity recovery|deload|Recovery|1|Finish the demanding task, reduce effort and allow time to settle. Avoid adding a finisher merely because the main work is complete.
Post-field recovery logistics|Post-field recovery|mcpfp|Recovery|0|After prolonged field or outdoor work, arrange practical access to rest, meals, drinks and clean dry clothing. Follow applicable occupational guidance and seek help for concerning symptoms.
`
  .trim()
  .split("\n")
  .map((line, index) => {
    const [name, category, source, target, demand, instructions] = line.split(
      "|",
    ) as [string, string, string, string, string, string];
    return {
      key: `recovery-${String(index + 1).padStart(3, "0")}`,
      name,
      category,
      source,
      target,
      demand: Number(demand),
      instructions,
      equipment:
        index === 1 || index === 4 ? ["cycle"] : index === 7 ? ["bench"] : [],
    };
  });
