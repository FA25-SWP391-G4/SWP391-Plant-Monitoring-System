package demo1;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

public class LLM {

    private static final String API_KEY = "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";  // Thay thế bằng API key của bạn
    private static final String API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";  // Model URL của Hugging Face

    // Phương thức gửi yêu cầu và nhận phản hồi từ API
    public String generateResponse(List<Message> messages) {
        try {
            StringBuilder prompt = new StringBuilder();
            // Xây dựng nội dung yêu cầu
            for (Message msg : messages) {
                prompt.append(msg.getContent()).append(" ");
            }

            // Tạo body yêu cầu (request body) dạng JSON
            JSONObject requestBody = new JSONObject();
            requestBody.put("inputs", prompt.toString().trim());

            // Tạo HttpRequest
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    .header("Authorization", "Bearer " + API_KEY)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            // Gửi yêu cầu và nhận phản hồi
            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            String body = response.body();

            System.out.println("Raw response from Hugging Face:");
            System.out.println(body);  // In ra phản hồi gốc

            // Xử lý phản hồi JSON
            if (body.trim().startsWith("[")) {
                JSONArray jsonArray = new JSONArray(body);
                return jsonArray.getJSONObject(0).getString("generated_text").trim();
            } else {
                JSONObject jsonObject = new JSONObject(body);
                if (jsonObject.has("error")) {
                    return "❌ API Error: " + jsonObject.getString("error");
                } else {
                    return "⚠️ Unexpected response:\n" + body;
                }
            }

        } catch (Exception e) {
            return "❗ Exception: " + e.getMessage();
        }
    }
}
