package demo1;

import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        // Tạo danh sách tin nhắn (giống hội thoại giữa user và assistant)
        List<Message> messages = new ArrayList<>();
        messages.add(new Message("user", "Hi, can you tell me a joke?"));

        // Tạo đối tượng LLM và gửi yêu cầu
        LLM llm = new LLM();
        String response = llm.generateResponse(messages);

        // In kết quả phản hồi
        System.out.println("AI Response:");
        System.out.println(response);
    }
}
