import { DEMANDS, FORMATIONS, type Payload } from "@formation-zero/knowledge";
export type ExerciseDraft = {
  key: string;
  batch: number;
  sources: string[];
  equipment: string[];
  prior: string | null;
  data: Payload;
  media: Payload;
};
// Explicit per-movement editorial scores. Digits follow DEMANDS / FORMATIONS order,
// never a workload calculation. Every row is checked by the integrity test.
export function batch(number: number, text: string): ExerciseDraft[] {
  return text
    .trim()
    .split("\n")
    .map((line, index) => {
      const p = line.trim().split("|");
      if (p.length !== 13)
        throw new Error(
          `Malformed batch ${number} row ${index + 1}: ${p.length}`,
        );
      const [
        name,
        movement,
        capability,
        equipment,
        complexity,
        demands,
        formations,
        instructions,
        cue,
        fault,
        caution,
        source,
        prior,
      ] = p as [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ];
      if (
        demands.length !== DEMANDS.length ||
        formations.length !== FORMATIONS.length
      )
        throw new Error(`Invalid score dimensions: ${name}`);
      const level = Number(complexity),
        ordinal = (number - 1) * 25 + index + 1;
      const key = `exercise-${String(ordinal).padStart(3, "0")}`;
      const motion = level >= 4 ? "HIGH" : level >= 3 ? "MODERATE" : "LOW";
      const views =
        level >= 4
          ? ["START", "KEY_POSITION", "FINISH", "COMMON_FAULT"]
          : ["START", "KEY_POSITION", "FINISH"];
      return {
        key,
        batch: number,
        sources: source.split(","),
        equipment: equipment ? equipment.split(",") : [],
        prior: prior ? `exercise-${prior.padStart(3, "0")}` : null,
        data: {
          name,
          notes:
            "Original Formation Zero draft prepared with Codex. Unreviewed; not a workout prescription. Stop for pain or loss of control. Professional review and rights decision pending.",
          aliases: [],
          summary: instructions.split(". ")[0] + ".",
          instructions,
          coaching_cues: [cue],
          common_faults: [fault],
          cautions: [caution],
          primary_movement: movement,
          secondary_movements: [],
          primary_capability: capability,
          secondary_capabilities: [],
          technical_complexity: level,
          demand_profile: Object.fromEntries(
            DEMANDS.map((k, i) => [k, Number(demands[i])]),
          ),
          formation_suitability: Object.fromEntries(
            FORMATIONS.map((k, i) => [k, Number(formations[i])]),
          ),
          individual_suitability: Number(formations[0]),
          scaling_available: Boolean(prior),
          restrictions: [],
          media_assets: [],
          variant: prior ? "OTHER" : null,
          classification_rationale: `Provisional ${movement} / ${capability} classification for ${name}. ${cue} Group rating reflects ${equipment ? "equipment availability and clearance" : "personal spacing and demonstration visibility"}; complexity ${level}/5 reflects coordination and supervision needs. Demand assumes controlled technique, not maximal effort; actual load, duration and the person change demand.`,
        },
        media: {
          name: `${name} — still sequence`,
          notes: `Show ${cue.toLowerCase()} Include a clear view of ${fault.toLowerCase()} only as a labelled common fault if produced. No asset has been produced.`,
          media_requirement_type: "STILL_SEQUENCE",
          minimum_images: 3,
          recommended_images: views.length,
          maximum_images: views.length,
          required_views: views,
          motion_complexity: motion,
          video_recommended: level >= 4,
          video_required: false,
          technical_media_review_required: true,
          rights_review_required: true,
        },
      };
    });
}
export const batch1 = batch(
  1,
  `
Wall push-up|Push|Relative Strength||1|11011010011001|555443|Face a wall and place both palms at chest height. Step back slightly, bend the elbows to bring the chest toward the wall, then press away while the body stays aligned.|Move chest and hips together.|Letting the hips reach the wall first.|Use a stable wall and footwear that grips.|push|
Incline push-up|Push|Relative Strength|bench|2|21113020022012|554321|Place hands on a fixed bench and walk the feet back to a straight-body incline. Lower the chest between the hands, then press back without dropping the pelvis.|Keep the bench from moving.|Resting the abdomen on the edge.|Do not use rolling or folding furniture.|push|1
Floor push-up|Push|Relative Strength||2|22114030022012|555443|Begin on hands and toes with the trunk held steady. Bend the elbows to lower the chest toward the floor, then press the floor away to return as one unit.|Keep the head in line with the trunk.|Reaching the chin down ahead of the chest.|Choose the incline version when alignment cannot be maintained.|push|2
Knee push-up|Push|Muscular Endurance||1|21112020011001|555443|Support the body on hands and knees with a straight line from head to knees. Bend the elbows to lower the chest, then push back while keeping the hips extended.|Keep the support line long.|Folding at the hips on the ascent.|Pad the knees if floor contact is uncomfortable.|push|1
Bodyweight squat|Squat|Relative Strength||2|22110120022112|555554|Stand with feet in a comfortable squat stance. Bend the knees and hips to lower between the feet, then stand through the whole foot at a depth you control.|Let knees follow the toes.|Heels lifting as depth increases.|Use a smaller depth if balance or comfort changes.|squat|
Bench sit-to-stand|Squat|Relative Strength|bench|1|11010110011001|554321|Sit near the front of a fixed bench with feet planted. Lean the trunk slightly forward, stand without throwing the arms, then return to a controlled seated position.|Place the feet before rising.|Dropping onto the seat.|Check that the bench is fixed and at an accessible height.|squat|5
Bodyweight hip hinge|Hinge|Coordination||2|11210120012111|555443|Stand with softly bent knees and hands across the ribs. Send the hips backward as the torso inclines, then bring the hips forward to stand without leaning back.|Move the hips behind the heels.|Turning the movement into a deep knee bend.|Keep the range small while learning the pattern.|hinge|
Glute bridge|Hinge|Stability||1|11010220011001|555443|Lie on the back with knees bent and feet flat. Press into the feet to raise the hips, pause before the lower back arches, then lower the pelvis smoothly.|Finish with ribs quiet.|Pushing so high that the back arches.|Do not push through back discomfort.|hinge|
Split squat|Lunge|Relative Strength||2|22210220022112|555443|Take a staggered stance with space between the feet. Bend both knees to lower vertically, then press through the front foot to stand while maintaining the stance.|Keep the feet on separate tracks.|Feet crossing onto a single line.|Use nearby stable support when balance is uncertain.|lunge|
Reverse lunge|Lunge|Balance||3|22310220023112|554432|From standing, step one foot backward and lower both knees. Press through the forward foot to bring the rear foot back alongside it, then reset before changing sides.|Step back before lowering.|Pushing off before the front foot is stable.|Leave clear space behind you.|lunge|9
Lateral lunge|Lunge|Mobility||3|22210220023112|554432|Step to one side and bend that knee as the hips move back. Keep the other leg long without locking it, then push through the bent leg to return to standing.|Sit into the stepping hip.|Rolling onto the inside edge of the foot.|Use a shorter step until the side position is controlled.|lunge|9
Forward lunge|Lunge|Coordination||3|22320220023122|554432|Step forward onto a planted foot and bend both knees to absorb the step. Push back to the starting position and regain balance before repeating.|Land quietly before descending.|Slamming the forward heel into the floor.|Use reverse lunges if forward deceleration is not controlled.|lunge|10
Standing calf raise|Lift|Muscular Endurance||1|11010110011111|555554|Stand tall with feet planted and a stable support nearby. Rise onto the balls of the feet without rolling the ankles outward, then lower the heels slowly.|Lift straight upward.|Bouncing through the bottom.|Keep a hand support available for balance.|hitt|
Single-leg balance|Brace|Balance||2|10200120002001|555443|Stand beside a stable support and shift weight onto one foot. Lift the other foot slightly, keep the pelvis level, then return the foot to the ground before changing sides.|Keep a soft supporting knee.|Gripping the floor while the pelvis drops.|Stay within reach of a stable support.|hitt|
Forearm plank|Brace|Stability||2|21112030002002|555443|Place forearms on the floor with elbows under shoulders and extend the legs. Hold the trunk in line while breathing normally, then lower the knees before releasing tension.|Keep ribs and pelvis aligned.|Holding the breath to prolong the position.|End the hold when trunk control changes.|push|
Side plank from knees|Brace|Stability||2|21211030002001|555443|Lie on one side with knees bent and the forearm beneath the shoulder. Raise the hips until the trunk and thighs align, then lower gently before changing sides.|Stack the shoulder over the elbow.|Rolling the upper shoulder forward.|Use padding beneath the forearm and knees.|push|
Side plank|Brace|Stability||3|22312040003002|554432|Support the body on one forearm and the sides of the feet. Raise the hips into a long side line, maintain normal breathing, and lower under control.|Keep the waist lifted.|Rotating the pelvis toward the floor.|Use the knee-supported version if shoulder loading is uncomfortable.|push|16
Dead bug heel tap|Brace|Coordination||2|11200130002001|555443|Lie on the back with knees above the hips and arms pointing upward. Lower one heel toward the floor without changing the trunk position, return it, then alternate.|Keep the ribs settled.|Arching the back as the foot lowers.|Shorten the reach rather than forcing floor contact.|hitt|
Bird dog|Anti-Rotation|Stability||3|11301130003001|555443|Start on hands and knees. Reach one arm and the opposite leg away while keeping the pelvis level, then return them beneath the body before alternating.|Reach long rather than high.|Twisting the hips to lift the leg.|Use only an arm or leg reach if balance is lost.|hitt|
Quadruped shoulder tap|Anti-Rotation|Stability||2|11212030002001|555443|From hands and knees, transfer weight gradually into one palm. Touch the other hand to the opposite shoulder, replace it quietly, then switch sides.|Keep the belt line level.|Rocking the body to free the hand.|Do not rush the weight transfer through the wrist.|push|
Bear hover|Brace|Strength Endurance||3|22312140003012|554432|Set hands beneath shoulders and knees beneath hips. Lift the knees just clear of the floor while maintaining a flat trunk, then set them down gently.|Hover low without moving forward.|Raising the hips into a pike.|Keep the hold brief enough to preserve breathing and wrist comfort.|hitt|20
Bear crawl|Crawl|Coordination||3|23322240003022|544321|Begin in a low bear hover. Move one hand and the opposite foot a short distance, alternate pairs, and stop before the trunk begins to sway.|Take small opposing steps.|Reaching so far that the hips swing.|Use a clear, dry lane and maintain space from others.|hitt|21
Half-kneeling stand|Ground-to-Standing|Balance||2|22210220012112|555443|Begin with one knee down and the other foot planted ahead. Lean slightly over the forward foot, stand without twisting, then return to kneeling under control.|Press through the whole front foot.|Rolling onto the edge of the front foot.|Use a stable hand support if getting down is uncertain.|lunge|9
Prone arm lift|Pull|Coordination||2|10211010002001|555443|Lie face down with the forehead supported and arms angled out. Lift the hands slightly without lifting the chest, then lower them slowly.|Keep the neck relaxed.|Using a large back arch to raise the arms.|Keep the lift small and free of shoulder discomfort.|pull|
Squat to calf raise|Squat|Coordination||3|22310220023122|555443|Complete a controlled bodyweight squat. As you stand, continue onto the balls of the feet without jumping, lower the heels, and reset before the next squat.|Finish the squat before lifting heels.|Rocking forward during the squat.|Remain on the floor; this is not a jump drill.|squat|5
`,
);
