package Demo;

import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Tạo bài học mẫu
        List<Lesson> allLessons = List.of(
            new Lesson("Java Cơ bản", "Java", 2),
            new Lesson("OOP trong Java", "Java", 3),
            new Lesson("Python nhập môn", "Python", 1),
            new Lesson("Machine Learning cơ bản", "Machine Learning", 3),
            new Lesson("Java Nâng cao", "Java", 4),
            new Lesson("Xử lý dữ liệu với Pandas", "Python", 3)
        );

        // Tạo người dùng
        User user = new User("Nguyen Van A");

        // Hiển thị tất cả bài học
        System.out.println("==== Danh sách bài học ====");
        for (int i = 0; i < allLessons.size(); i++) {
            System.out.println((i + 1) + ". " + allLessons.get(i));
        }

        // Cho người dùng chọn bài học đã học
        Scanner scanner = new Scanner(System.in);
        System.out.println("\nNhập số bài học bạn đã hoàn thành (cách nhau bằng dấu phẩy): ");
        String input = scanner.nextLine();
        String[] selections = input.split(",");

        for (String s : selections) {
            try {
                int index = Integer.parseInt(s.trim()) - 1;
                if (index >= 0 && index < allLessons.size()) {
                    user.completeLesson(allLessons.get(index));
                }
            } catch (NumberFormatException e) {
                System.out.println("Lỗi định dạng: " + s);
            }
        }

        // Gợi ý bài học
        String favTopic = user.getFavoriteTopic();
        if (favTopic == null) {
            System.out.println("\nKhông có đủ dữ liệu để gợi ý.");
            return;
        }

        System.out.println("\n🎯 Chủ đề yêu thích của bạn: " + favTopic);
        System.out.println("📚 Gợi ý bài học phù hợp:");

        for (Lesson lesson : allLessons) {
            if (!user.completedLessons.contains(lesson)
                    && lesson.topic.equalsIgnoreCase(favTopic)) {
                System.out.println(" - " + lesson);
            }
        }
    }
}
