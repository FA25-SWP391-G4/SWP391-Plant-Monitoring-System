package Demo;

public class Lesson {
    public String title;
    public String topic;
    public int difficulty; // 1-5

    public Lesson(String title, String topic, int difficulty) {
        this.title = title;
        this.topic = topic;
        this.difficulty = difficulty;
    }

    @Override
    public String toString() {
        return title + " [" + topic + ", Độ khó: " + difficulty + "]";
    }
}
