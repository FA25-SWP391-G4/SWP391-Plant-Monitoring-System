package demo3;

import java.io.*;
import java.net.*;
import java.util.*;

public class AIQuizGenerator {

    private static final String API_KEY = "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"; // Hugging Face API key của bạn

    // Gửi đoạn văn lên HF tạo câu hỏi mở
    public static String generateQuestion(String inputText) throws Exception {
        String url = "https://api-inference.huggingface.co/models/valhalla/t5-small-qa-qg-hl";
        String prompt = "Create a question from this text:\n" + inputText;

        String payload = "{ \"inputs\": \"" + prompt.replace("\"", "\\\"") + "\" }";

        URL obj = new URL(url);
        HttpURLConnection con = (HttpURLConnection) obj.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Authorization", "Bearer " + API_KEY);
        con.setRequestProperty("Content-Type", "application/json");
        con.setDoOutput(true);

        try (OutputStream os = con.getOutputStream()) {
            byte[] input = payload.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        try (BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream(), "utf-8"))) {
            StringBuilder response = new StringBuilder();
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }

            return extractGeneratedText(response.toString());
        }
    }

    // Trích câu hỏi từ JSON trả về
    private static String extractGeneratedText(String json) {
        int start = json.indexOf("\"generated_text\":\"") + 18;
        int end = json.indexOf("\"", start);
        if (start > 17 && end > start) {
            return json.substring(start, end).replace("\\n", " ").replace("\\\"", "\"");
        } else {
            return "Could not parse quiz response.";
        }
    }

    // Tạo 3 lựa chọn sai giả (đơn giản)
    private static List<String> generateFakeOptions(String correctAnswer) {
        List<String> fakeOptions = new ArrayList<>();
        fakeOptions.add("Option A");
        fakeOptions.add("Option B");
        fakeOptions.add("Option C");

        // Loại bỏ trùng với đáp án đúng nếu có
        fakeOptions.removeIf(opt -> opt.equalsIgnoreCase(correctAnswer));

        // Nếu fakeOptions bị loại nhiều thì bổ sung thêm
        while (fakeOptions.size() < 3) {
            fakeOptions.add("Dummy option " + (fakeOptions.size() + 1));
        }

        return fakeOptions.subList(0, 3);
    }

    // Tạo quiz dạng trắc nghiệm 4 lựa chọn
    public static String generateMultipleChoiceQuiz(String inputText) throws Exception {
        String question = generateQuestion(inputText);
        if (question.startsWith("Could not")) {
            return question;
        }

        // Tạm lấy câu hỏi làm đáp án đúng (bạn có thể xử lý lại logic đáp án đúng theo ý)
        String correctAnswer = "Correct Answer";

        List<String> options = generateFakeOptions(correctAnswer);
        options.add(correctAnswer);
        Collections.shuffle(options);

        StringBuilder quiz = new StringBuilder();
        quiz.append("Question: ").append(question).append("\n");
        char optionChar = 'A';
        for (String option : options) {
            quiz.append(optionChar).append(". ").append(option).append("\n");
            optionChar++;
        }
        quiz.append("Correct answer: ").append(correctAnswer).append("\n");

        return quiz.toString();
    }

    // Test thử
    public static void main(String[] args) throws Exception {
        String inputText = "Albert Einstein was a theoretical physicist who developed the theory of relativity. He won the Nobel Prize in Physics in 1921.";
        String quiz = generateMultipleChoiceQuiz(inputText);
        System.out.println(quiz);
    }
}
