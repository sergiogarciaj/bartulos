
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Item, Box, Location } from "../types";

const IMAGE_SYSTEM_INSTRUCTION = `
Eres un asistente experto en organización de hogar e inventarios.
Tu tarea es analizar fotos de objetos domésticos y devolver una descripción estructurada en formato JSON.
El idioma de salida debe ser ESPAÑOL.
Sé conciso y preciso.
`;

const CHAT_SYSTEM_INSTRUCTION = `
Eres "Bartulos AI", un asistente inteligente de gestión de inventario personal.
Tu objetivo es ayudar al usuario a encontrar sus pertenencias basándote ÚNICAMENTE en la lista de inventario que se te proporciona.

REGLAS:
1. Responde siempre en ESPAÑOL.
2. Usa un tono útil, amable y conciso.
3. Si te preguntan "¿Dónde está X?", busca en la lista y responde con la jerarquía completa: Lugar > Caja > Objeto.
4. Si el objeto no está en la lista, dilo claramente: "No tengo registro de ese objeto en el inventario actual."
5. Puedes hacer resúmenes (ej: "Tienes 5 cajas en el sótano").
6. NO inventes información. Solo usa los datos provistos en el contexto.
`;

export const analyzeImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Remove header from base64 string if present
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          },
          {
            text: "Analiza esta imagen. Identifica el objeto principal. Dame un nombre corto, una descripción de 1 frase y 3-5 etiquetas relevantes para búsqueda."
          }
        ]
      },
      config: {
        systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nombre corto del objeto (ej: 'Taladro Bosch')" },
            description: { type: Type.STRING, description: "Breve descripción visual y funcional" },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de etiquetas para facilitar la búsqueda (ej: ['herramienta', 'eléctrico', 'bricolaje'])"
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    
    throw new Error("No se pudo generar una descripción.");

  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback for demo if API fails or key is missing
    return {
      name: "Objeto Detectado",
      description: "No se pudo conectar con la IA para analizar la imagen. Por favor completa los detalles manualmente.",
      tags: ["manual"]
    };
  }
};

export const searchPlaceWithMaps = async (query: string): Promise<{ address: string, uri: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use Gemini 2.5 Flash for Maps Grounding support
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `Find the address and google maps link for: ${query}.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    // Check for grounding chunks
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const groundingMetadata = candidates[0].groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingChunks) {
        // Look for Maps URI in chunks
        const mapsChunk = groundingMetadata.groundingChunks.find(c => c.web?.uri?.includes("google.com/maps") || (c as any).maps);
        
        let uri = "";
        if (mapsChunk) {
            // Depending on API version, it might be in web.uri or maps object
            uri = mapsChunk.web?.uri || ""; 
        }

        // The model text usually contains the address or description
        const address = response.text || query;

        return { address, uri };
      }
    }
    return { address: query, uri: "" };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return { address: query, uri: "" };
  }
};

export const askInventoryAssistant = async (
  message: string, 
  history: { role: 'user' | 'model', text: string }[],
  data: { items: Item[], boxes: Box[], locations: Location[] }
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 1. Construct the Knowledge Base string (RAG Lite)
    let contextString = "INVENTARIO ACTUAL:\n";
    
    // Map data for faster lookup
    const locMap = new Map(data.locations.map(l => [l.id, l.name]));
    const boxesInLoc = (locId: string) => data.boxes.filter(b => b.locationId === locId);
    const itemsInBox = (boxId: string) => data.items.filter(i => i.boxId === boxId);

    // Build hierarchy text
    data.locations.forEach(loc => {
      contextString += `\n[LUGAR: ${loc.name}] (${loc.description})\n`;
      const boxes = boxesInLoc(loc.id);
      if (boxes.length === 0) contextString += "  (Sin cajas)\n";
      
      boxes.forEach(box => {
        contextString += `  > [CAJA: ${box.name}] (Código: ${box.code}, Desc: ${box.description})\n`;
        const items = itemsInBox(box.id);
        if (items.length === 0) contextString += "    - (Vacía)\n";
        
        items.forEach(item => {
          const loanStatus = item.loan.isLoaned ? `(PRESTADO a ${item.loan.borrowerName})` : "";
          contextString += `    - ITEM: ${item.name} | Tags: ${item.tags.join(', ')} | Desc: ${item.description} ${loanStatus}\n`;
        });
      });
    });

    // Orphan boxes (no location or old string location)
    const orphanBoxes = data.boxes.filter(b => !b.locationId && !locMap.has(b.location)); // Simple check
    if (orphanBoxes.length > 0) {
       contextString += `\n[UBICACIÓN DESCONOCIDA / ANTIGUA]\n`;
       orphanBoxes.forEach(box => {
          contextString += `  > [CAJA: ${box.name}] (Ubicación texto: ${box.location})\n`;
          const items = itemsInBox(box.id);
          items.forEach(item => {
             contextString += `    - ITEM: ${item.name}\n`;
          });
       });
    }

    // 2. Prepare History for Chat
    
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION + "\n\nDATOS DE CONTEXTO:\n" + contextString,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Lo siento, no pude procesar la respuesta.";

  } catch (error) {
    console.error("Chat Error:", error);
    return "Error conectando con el cerebro digital. Verifica tu conexión o intenta más tarde.";
  }
};