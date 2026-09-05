# Initial exercise corpus

Exactly 100 production-candidate entities in four batches of 25. Each batch was schema-validated before proceeding. All are INGESTED, FZ_DERIVED, UNKNOWN rights and pending TECHNICAL, SAFETY, EDITORIAL and RIGHTS review. Original instructions/cues/faults/cautions are checked in under database/corpus; citations support principle context only. Database-issued stable FZ codes remain attached to entities across editorial versions; import keys identify the same candidate across environments.

| Import key   | Batch | Name                                        | Movement            | Capability            | Complexity | Related candidate | Source principle |
| ------------ | ----- | ------------------------------------------- | ------------------- | --------------------- | ---------- | ----------------- | ---------------- |
| exercise-001 | 1     | Wall push-up                                | Push                | Relative Strength     | 1          | None              | push             |
| exercise-002 | 1     | Incline push-up                             | Push                | Relative Strength     | 2          | exercise-001      | push             |
| exercise-003 | 1     | Floor push-up                               | Push                | Relative Strength     | 2          | exercise-002      | push             |
| exercise-004 | 1     | Knee push-up                                | Push                | Muscular Endurance    | 1          | exercise-001      | push             |
| exercise-005 | 1     | Bodyweight squat                            | Squat               | Relative Strength     | 2          | None              | squat            |
| exercise-006 | 1     | Bench sit-to-stand                          | Squat               | Relative Strength     | 1          | exercise-005      | squat            |
| exercise-007 | 1     | Bodyweight hip hinge                        | Hinge               | Coordination          | 2          | None              | hinge            |
| exercise-008 | 1     | Glute bridge                                | Hinge               | Stability             | 1          | None              | hinge            |
| exercise-009 | 1     | Split squat                                 | Lunge               | Relative Strength     | 2          | None              | lunge            |
| exercise-010 | 1     | Reverse lunge                               | Lunge               | Balance               | 3          | exercise-009      | lunge            |
| exercise-011 | 1     | Lateral lunge                               | Lunge               | Mobility              | 3          | exercise-009      | lunge            |
| exercise-012 | 1     | Forward lunge                               | Lunge               | Coordination          | 3          | exercise-010      | lunge            |
| exercise-013 | 1     | Standing calf raise                         | Lift                | Muscular Endurance    | 1          | None              | hitt             |
| exercise-014 | 1     | Single-leg balance                          | Brace               | Balance               | 2          | None              | hitt             |
| exercise-015 | 1     | Forearm plank                               | Brace               | Stability             | 2          | None              | push             |
| exercise-016 | 1     | Side plank from knees                       | Brace               | Stability             | 2          | None              | push             |
| exercise-017 | 1     | Side plank                                  | Brace               | Stability             | 3          | exercise-016      | push             |
| exercise-018 | 1     | Dead bug heel tap                           | Brace               | Coordination          | 2          | None              | hitt             |
| exercise-019 | 1     | Bird dog                                    | Anti-Rotation       | Stability             | 3          | None              | hitt             |
| exercise-020 | 1     | Quadruped shoulder tap                      | Anti-Rotation       | Stability             | 2          | None              | push             |
| exercise-021 | 1     | Bear hover                                  | Brace               | Strength Endurance    | 3          | exercise-020      | hitt             |
| exercise-022 | 1     | Bear crawl                                  | Crawl               | Coordination          | 3          | exercise-021      | hitt             |
| exercise-023 | 1     | Half-kneeling stand                         | Ground-to-Standing  | Balance               | 2          | exercise-009      | lunge            |
| exercise-024 | 1     | Prone arm lift                              | Pull                | Coordination          | 2          | None              | pull             |
| exercise-025 | 1     | Squat to calf raise                         | Squat               | Coordination          | 3          | exercise-005      | squat            |
| exercise-026 | 2     | Goblet squat                                | Squat               | Relative Strength     | 2          | exercise-005      | squat            |
| exercise-027 | 2     | Dumbbell front squat                        | Squat               | Relative Strength     | 3          | exercise-026      | squat            |
| exercise-028 | 2     | Dumbbell Romanian deadlift                  | Hinge               | Relative Strength     | 3          | exercise-007      | hinge            |
| exercise-029 | 2     | Kettlebell deadlift                         | Hinge               | Relative Strength     | 2          | exercise-007      | hinge            |
| exercise-030 | 2     | Barbell deadlift                            | Hinge               | Maximal Strength      | 4          | exercise-029      | hinge            |
| exercise-031 | 2     | Dumbbell floor press                        | Push                | Relative Strength     | 2          | exercise-003      | push             |
| exercise-032 | 2     | Dumbbell bench press                        | Push                | Relative Strength     | 3          | exercise-031      | push             |
| exercise-033 | 2     | Standing dumbbell overhead press            | Push                | Relative Strength     | 3          | exercise-031      | push             |
| exercise-034 | 2     | Half-kneeling single-arm press              | Push                | Stability             | 3          | exercise-033      | push             |
| exercise-035 | 2     | Bench-supported dumbbell row                | Pull                | Relative Strength     | 2          | exercise-024      | pull             |
| exercise-036 | 2     | Standing band row                           | Pull                | Muscular Endurance    | 2          | exercise-035      | pull             |
| exercise-037 | 2     | Band pull-apart                             | Pull                | Muscular Endurance    | 2          | exercise-024      | pull             |
| exercise-038 | 2     | Pull-up                                     | Pull                | Relative Strength     | 4          | exercise-035      | pull             |
| exercise-039 | 2     | Chin-up                                     | Pull                | Relative Strength     | 4          | exercise-038      | pull             |
| exercise-040 | 2     | Dumbbell reverse lunge                      | Lunge               | Relative Strength     | 3          | exercise-010      | lunge            |
| exercise-041 | 2     | Dumbbell step-up                            | Climb               | Relative Strength     | 3          | exercise-023      | lunge            |
| exercise-042 | 2     | Dumbbell farmer carry                       | Carry               | Grip                  | 2          | exercise-029      | carry            |
| exercise-043 | 2     | Suitcase carry                              | Carry               | Stability             | 3          | exercise-042      | carry            |
| exercise-044 | 2     | Front-rack kettlebell carry                 | Carry               | Load Carriage         | 3          | exercise-043      | carry            |
| exercise-045 | 2     | Sandbag bear-hug carry                      | Carry               | Work Capacity         | 3          | exercise-042      | carry            |
| exercise-046 | 2     | Medicine-ball chest pass to wall            | Throw               | Power                 | 4          | exercise-003      | hitt             |
| exercise-047 | 2     | Medicine-ball rotational wall throw         | Throw               | Power                 | 4          | exercise-046      | hitt             |
| exercise-048 | 2     | Kettlebell swing                            | Hinge               | Power                 | 4          | exercise-029      | hitt             |
| exercise-049 | 2     | Squat jump with reset                       | Jump                | Power                 | 4          | exercise-025      | hitt             |
| exercise-050 | 2     | Snap-down landing practice                  | Land                | Coordination          | 3          | exercise-005      | hitt             |
| exercise-051 | 3     | Level-ground walk                           | Locomotion          | Aerobic Endurance     | 1          | None              | aerobic          |
| exercise-052 | 3     | Brisk walk                                  | Locomotion          | Aerobic Endurance     | 1          | exercise-051      | aerobic          |
| exercise-053 | 3     | Easy jog                                    | Locomotion          | Running               | 2          | exercise-052      | aerobic          |
| exercise-054 | 3     | Running stride with controlled acceleration | Sprint              | Speed                 | 4          | exercise-053      | aerobic          |
| exercise-055 | 3     | Uphill walk                                 | Locomotion          | Work Capacity         | 2          | exercise-051      | aerobic          |
| exercise-056 | 3     | March in place                              | Locomotion          | Coordination          | 1          | None              | hitt             |
| exercise-057 | 3     | Forward marching drill                      | Locomotion          | Coordination          | 2          | exercise-056      | hitt             |
| exercise-058 | 3     | Low skip                                    | Locomotion          | Coordination          | 3          | exercise-057      | hitt             |
| exercise-059 | 3     | Lateral shuffle                             | Change of Direction | Agility               | 3          | exercise-011      | hitt             |
| exercise-060 | 3     | Backpedal to forward walk                   | Change of Direction | Coordination          | 3          | exercise-051      | hitt             |
| exercise-061 | 3     | Cone turn walk                              | Change of Direction | Agility               | 2          | exercise-051      | hitt             |
| exercise-062 | 3     | Shuttle run with deceleration               | Change of Direction | Agility               | 4          | exercise-061      | hitt             |
| exercise-063 | 3     | Jump-rope basic bounce                      | Jump                | Coordination          | 3          | exercise-050      | hitt             |
| exercise-064 | 3     | Low step-up rhythm                          | Climb               | Aerobic Endurance     | 2          | exercise-023      | aerobic          |
| exercise-065 | 3     | Stationary cycle                            | Locomotion          | Aerobic Endurance     | 2          | exercise-051      | aerobic          |
| exercise-066 | 3     | Rowing ergometer technique                  | Pull                | Aerobic Endurance     | 4          | exercise-036      | aerobic          |
| exercise-067 | 3     | Elliptical trainer                          | Locomotion          | Aerobic Endurance     | 2          | exercise-051      | aerobic          |
| exercise-068 | 3     | Backward sled drag                          | Drag                | Work Capacity         | 3          | exercise-042      | hitt             |
| exercise-069 | 3     | Forward sled push                           | Push                | Work Capacity         | 3          | exercise-003      | push             |
| exercise-070 | 3     | Sandbag ground-to-bench lift                | Lift                | Tactical Conditioning | 4          | exercise-045      | hinge            |
| exercise-071 | 3     | Ruck walk on level ground                   | Locomotion          | Rucking               | 3          | exercise-051      | ruck             |
| exercise-072 | 3     | Loaded pack step-up                         | Climb               | Load Carriage         | 4          | exercise-064      | ruck             |
| exercise-073 | 3     | Farmer carry around a marker                | Carry               | Work Capacity         | 3          | exercise-042      | carry            |
| exercise-074 | 3     | Bear crawl lateral                          | Crawl               | Coordination          | 4          | exercise-022      | hitt             |
| exercise-075 | 3     | Walk-to-jog transition                      | Locomotion          | Running               | 2          | exercise-053      | aerobic          |
| exercise-076 | 4     | Standing ankle rock                         | Locomotion          | Mobility              | 1          | None              | mobility         |
| exercise-077 | 4     | Half-kneeling hip shift                     | Lunge               | Mobility              | 2          | exercise-023      | mobility         |
| exercise-078 | 4     | Quadruped rock-back                         | Hinge               | Mobility              | 1          | exercise-007      | mobility         |
| exercise-079 | 4     | Side-lying thoracic rotation                | Rotation            | Mobility              | 2          | None              | mobility         |
| exercise-080 | 4     | Quadruped thoracic turn                     | Rotation            | Mobility              | 3          | exercise-079      | mobility         |
| exercise-081 | 4     | Standing shoulder circle                    | Rotation            | Mobility              | 1          | None              | mobility         |
| exercise-082 | 4     | Wall arm slide                              | Push                | Mobility              | 2          | exercise-081      | mobility         |
| exercise-083 | 4     | Standing hip circle                         | Rotation            | Mobility              | 2          | exercise-014      | mobility         |
| exercise-084 | 4     | Supine knee sway                            | Rotation            | Mobility              | 1          | None              | mobility         |
| exercise-085 | 4     | Seated hip rotation switch                  | Rotation            | Mobility              | 3          | exercise-083      | mobility         |
| exercise-086 | 4     | Supported single-leg hinge                  | Hinge               | Balance               | 3          | exercise-007      | hinge            |
| exercise-087 | 4     | Single-leg bridge                           | Hinge               | Strength Endurance    | 3          | exercise-008      | hinge            |
| exercise-088 | 4     | Band lateral walk                           | Locomotion          | Stability             | 2          | exercise-059      | hitt             |
| exercise-089 | 4     | Band anti-rotation press                    | Anti-Rotation       | Stability             | 3          | exercise-020      | hitt             |
| exercise-090 | 4     | Tall-kneeling band pulldown                 | Pull                | Muscular Endurance    | 3          | exercise-036      | pull             |
| exercise-091 | 4     | Dumbbell hammer curl                        | Pull                | Muscular Endurance    | 1          | exercise-035      | pull             |
| exercise-092 | 4     | Standing band triceps pressdown             | Push                | Muscular Endurance    | 2          | exercise-036      | push             |
| exercise-093 | 4     | Dumbbell lateral raise                      | Lift                | Muscular Endurance    | 2          | exercise-081      | hitt             |
| exercise-094 | 4     | Single-leg calf raise                       | Lift                | Balance               | 2          | exercise-013      | hitt             |
| exercise-095 | 4     | Low lateral step-over                       | Locomotion          | Coordination          | 3          | exercise-059      | hitt             |
| exercise-096 | 4     | Partner mirror footwork                     | Change of Direction | Coordination          | 3          | exercise-061      | hitt             |
| exercise-097 | 4     | Sandbag front hold                          | Brace               | Strength Endurance    | 2          | exercise-045      | carry            |
| exercise-098 | 4     | Plank shoulder tap                          | Anti-Rotation       | Stability             | 4          | exercise-020      | push             |
| exercise-099 | 4     | Standing cross-body knee lift               | Rotation            | Coordination          | 2          | exercise-056      | hitt             |
| exercise-100 | 4     | Controlled squat-to-stand reach             | Ground-to-Standing  | Mobility              | 3          | exercise-005      | mobility         |

## Classification audit

| Primary movement    | Count |
| ------------------- | ----- |
| Push                | 11    |
| Pull                | 9     |
| Squat               | 5     |
| Hinge               | 9     |
| Lunge               | 6     |
| Rotation            | 7     |
| Anti-Rotation       | 4     |
| Brace               | 7     |
| Carry               | 5     |
| Locomotion          | 14    |
| Crawl               | 2     |
| Ground-to-Standing  | 2     |
| Jump                | 2     |
| Land                | 1     |
| Throw               | 2     |
| Sprint              | 1     |
| Change of Direction | 5     |
| Climb               | 3     |
| Drag                | 1     |
| Lift                | 4     |
| Aquatic             | 0     |

| Primary capability    | Count |
| --------------------- | ----- |
| Maximal Strength      | 1     |
| Relative Strength     | 18    |
| Strength Endurance    | 3     |
| Power                 | 4     |
| Speed                 | 1     |
| Acceleration          | 0     |
| Agility               | 3     |
| Aerobic Endurance     | 6     |
| Anaerobic Capacity    | 0     |
| Muscular Endurance    | 8     |
| Work Capacity         | 5     |
| Mobility              | 12    |
| Stability             | 11    |
| Coordination          | 16    |
| Balance               | 5     |
| Grip                  | 1     |
| Running               | 2     |
| Rucking               | 1     |
| Load Carriage         | 2     |
| Aquatic Conditioning  | 0     |
| Tactical Conditioning | 1     |
| Recovery              | 0     |
| Durability            | 0     |

Aquatic is intentionally absent: no supervised water environment is assumed. Zero counts are reported, not filled with unsafe or redundant material. Scores use the existing 0–5 scale and complexity 1–5. They are provisional editorial judgments, not measured workload. Each record includes a rationale and cautions; professional reviewers must assess these ratings.

Variants such as floor/incline/knee push-ups, loaded/unloaded lunges and lateral/forward crawls have distinct mechanics and explicit lineage. Aliases are empty rather than invented. Relationships are editorial alternatives, not automatic safe substitutions. No Phase C selection or prescription logic exists.
