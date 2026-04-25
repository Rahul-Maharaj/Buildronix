import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

// Use a valid, stable Gemini model
const GEMINI_MODEL = "gemini-2.5-flash";

/** Strip markdown code fences that some model versions add even with JSON mime type */
function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : raw.trim();
}

export const generateProject = async (idea: string, components: string[]) => {
  const prompt = `You are the Master AI Architect at Buildronix, specializing in guiding students with ZERO knowledge to build EXPERT-LEVEL, working IoT projects for final submissions.
  
  Student Intent: ${idea || "General IoT Innovation"}
  Hardware Inventory: ${components.length > 0 ? components.join(", ") : "Standard IoT Components (Arduino/ESP32, Sensors, Actuators)"}

  ### MISSION: 100% ACCURATE & B.TECH ENGINEERING-LEVEL GUIDANCE
  Provide a project that is technically flawless and guaranteed to work if followed exactly. YOU MUST ALWAYS GENERATE B.TECH (Bachelor of Technology) LEVEL ENGINEERING PROJECTS. The computational logic, sensor fusion, algorithmic complexity, or networking architecture should be university-grade, while the physical implementation remains achievable through breadboarding, simple wiring, and standard microcontrollers.

  ### REQUIREMENTS:
  1. FOUNDATIONAL KNOWLEDGE (100% Right): Explain the science behind the sensors. Never use placeholder pin numbers.
  2. VETERAN-LEVEL FIRMWARE: Provide production-ready C++ with extensive comments, error handling, power-saving logic.
  3. FOOL-PROOF WIRING & 3D VISUALIZATION:
     - layout3D MUST include both "component" and "wire" type placements.
     - Wires MUST have a "points" array of {x,y,z} objects with at least 3-4 waypoints for realistic routing.
     - CRITICAL: layout3D.placements MUST align sequentially with simulationGuide.setupSteps for the Virtual Sim playback engine.
     - Use vibrant hex colors for wires: Red (#ff0000) for Power, Black (#111111) for GND, Yellow/Blue/Green for signals.
  4. STEP-BY-STEP MASTER BUILD GUIDE: 10-15 granular steps with exact pin references.
  5. VIRTUAL SIMULATION GUIDE: Platform recommendation (Wokwi preferred) + 4-6 setup steps + testing instructions.
  6. ACADEMIC DOCUMENTATION: abstract, objective, working mechanism, conclusion.
  7. VIVA VOCE PREP: 10 hard professor questions with authoritative answers.

  Return ONLY valid JSON. Accuracy is the highest priority.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          useCase: { type: Type.STRING },
          components: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                specs: { type: Type.STRING },
                quantity: { type: Type.STRING }
              }
            }
          },
          estimatedCost: { type: Type.STRING },
          circuit: {
            type: Type.OBJECT,
            properties: {
              wiring: { type: Type.STRING },
              layout3D: { 
                type: Type.OBJECT,
                properties: {
                  housing: {
                    type: Type.OBJECT,
                    properties: {
                      dimensions: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                    }
                  },
                  placements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        size: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        color: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["component", "wire"] },
                        specs: { type: Type.STRING },
                        points: { 
                          type: Type.ARRAY, 
                          items: { 
                            type: Type.OBJECT,
                            properties: {
                              x: { type: Type.NUMBER },
                              y: { type: Type.NUMBER },
                              z: { type: Type.NUMBER }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              pinMap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    component: { type: Type.STRING },
                    pin: { type: Type.STRING },
                    arduinoPin: { type: Type.STRING }
                  }
                }
              }
            }
          },
          buildGuide: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.NUMBER },
                title: { type: Type.STRING },
                instruction: { type: Type.STRING },
                materials: { type: Type.STRING },
                materialsDetails: { type: Type.STRING },
                method: { type: Type.STRING },
                methodReasoning: { type: Type.STRING }
              },
              required: ["step", "title", "instruction", "materials", "materialsDetails", "method", "methodReasoning"]
            }
          },
          code: {
            type: Type.OBJECT,
            properties: {
              language: { type: Type.STRING },
              snippet: { type: Type.STRING },
              explanation: { type: Type.STRING }
            }
          },
          simulationGuide: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              setupSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              testingInstructions: { type: Type.STRING }
            },
            required: ["platform", "setupSteps", "testingInstructions"]
          },
          documentation: {
            type: Type.OBJECT,
            properties: {
              abstract: { type: Type.STRING },
              objective: { type: Type.STRING },
              working: { type: Type.STRING },
              conclusion: { type: Type.STRING }
            }
          },
          vivaQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              }
            }
          }
        },
        required: [
          "title", "description", "useCase", "components", "estimatedCost", 
          "circuit", "buildGuide", "code", "simulationGuide", "documentation", "vivaQuestions"
        ]
      }
    }
  });

  const rawText = response.text;
  if (!rawText) throw new Error("Empty response from Gemini API");
  return JSON.parse(extractJSON(rawText));
};

export const debugCode = async (errorMessage: string, code: string) => {
  const prompt = `You are a Senior IoT Support Engineer at Buildronix.
  The student has uploaded their code and described a fault or provided an error log.
  
  Fault Description / Error Log: ${errorMessage}
  Uploaded Code: ${code}
  
  Identify WHERE the fault is (exact line number or function), WHY it fails, provide corrected code snippets, and exact fix steps.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          faultLocation: { type: Type.STRING },
          analysis: { type: Type.STRING },
          correctedCode: { type: Type.STRING },
          steps: { type: Type.STRING }
        },
        required: ["faultLocation", "analysis", "correctedCode", "steps"]
      }
    }
  });

  const rawText = response.text;
  if (!rawText) throw new Error("Empty response from Gemini API");
  return JSON.parse(extractJSON(rawText));
};
