
import { GoogleGenAI } from "@google/genai";
import { Delivery, User } from "../types";

export const getPerformanceInsight = async (courier: User, deliveries: Delivery[]): Promise<string> => {
  // Always use a named parameter for apiKey and obtain it directly from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalItems = deliveries.reduce((sum, d) => sum + d.itemCount, 0);
  const totalEarnings = deliveries.reduce((sum, d) => sum + d.totalAmount, 0);
  const avgItems = deliveries.length > 0 ? (totalItems / deliveries.length).toFixed(1) : 0;

  const prompt = `Analisis performa kurir berikut:
    Nama: ${courier.name}
    Total Paket: ${totalItems}
    Total Gaji: Rp ${totalEarnings.toLocaleString('id-ID')}
    Rata-rata Paket/Hari: ${avgItems}
    
    Berikan ringkasan singkat dalam 2-3 kalimat mengenai performa kurir ini dan berikan saran motivasi dalam Bahasa Indonesia yang profesional.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
      }
    });
    // Use the .text property to access the generated content.
    return response.text || "Gagal menghasilkan insight.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Tidak dapat memuat insight performa saat ini.";
  }
};
