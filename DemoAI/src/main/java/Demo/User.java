/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Demo;

import java.util.ArrayList;
import java.util.List;

public class User {
    public String name;
    public List<Lesson> completedLessons;

    public User(String name) {
        this.name = name;
        this.completedLessons = new ArrayList<>();
    }

    public void completeLesson(Lesson lesson) {
        completedLessons.add(lesson);
    }

    public String getFavoriteTopic() {
        if (completedLessons.isEmpty()) return null;

        // Đếm tần suất mỗi topic
        java.util.Map<String, Integer> topicCount = new java.util.HashMap<>();
        for (Lesson lesson : completedLessons) {
            topicCount.put(lesson.topic, topicCount.getOrDefault(lesson.topic, 0) + 1);
        }

        // Tìm topic phổ biến nhất
        String favTopic = null;
        int max = 0;
        for (var entry : topicCount.entrySet()) {
            if (entry.getValue() > max) {
                favTopic = entry.getKey();
                max = entry.getValue();
            }
        }

        return favTopic;
    }
}
