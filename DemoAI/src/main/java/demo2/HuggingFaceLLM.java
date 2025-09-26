package demo2;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;
import org.json.JSONArray;
import org.json.JSONObject;

public class HuggingFaceLLM {

    // ✅ Hugging Face API Key — Đặt tại đây
    private static final String API_KEY = "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";

    // ✅ Mô hình bạn muốn dùng
    private static final String MODEL = "HuggingFaceH4/zephyr-7b-beta";

    /**
     * Gửi prompt đến Hugging Face và nhận phản hồi từ mô hình.
     */
    public static String generateResponse(String prompt) throws Exception {
        URL url = new URL("https://api-inference.huggingface.co/models/" + MODEL);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();

        // Cấu hình HTTP request
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Authorization", "Bearer " + API_KEY);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);

        // Gửi dữ liệu JSON
        String jsonInputString = "{ \"inputs\": \"" + prompt.replace("\"", "\\\"") + "\" }";
        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = jsonInputString.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        // Đọc phản hồi từ API
        Scanner scanner = new Scanner(connection.getInputStream(), "UTF-8");
        StringBuilder response = new StringBuilder();
        while (scanner.hasNext()) {
            response.append(scanner.nextLine());
        }
        scanner.close();

        return response.toString();
    }

    /**
     * Điểm khởi chạy chương trình
     */
    public static void main(String[] args) throws Exception {
        // Đảm bảo hiển thị UTF-8 ra console
        System.setOut(new java.io.PrintStream(System.out, true, "UTF-8"));

        // Gọi mô hình Hugging Face như bình thường
        HuggingFaceLLM llm = new HuggingFaceLLM();
        String prompt = "thực hiện phép cộng 1+1";
        String response = llm.generateResponse(prompt);
        JSONArray jsonArray = new JSONArray(response);
        if (jsonArray.length() > 0) {
            JSONObject obj = jsonArray.getJSONObject(0);
            String result = obj.getString("generated_text");
            System.out.println("Phản hồi từ mô hình:\n" + result);
        } else {
            System.out.println("Không có phản hồi từ mô hình.");
        }

    }

}
