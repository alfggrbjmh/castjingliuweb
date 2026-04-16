import java.util.HashMap;
import java.util.Map;

/**
 * Model Data untuk Postingan Komunitas Castorice & Jingliu.
 * Class ini digunakan untuk memetakan data dari Realtime Database Firebase.
 */
public class Post {
    public String firebaseKey;
    public String authorName;
    public String authorAvatar;
    public String content;
    public String image;
    public String link;
    public Long timestamp;
    public Map<String, Boolean> likedBy = new HashMap<>();
    public Map<String, Comment> comments = new HashMap<>();

    // Constructor Kosong (Wajib untuk Firebase)
    public Post() {}

    public Post(String authorName, String content) {
        this.authorName = authorName;
        this.content = content;
        this.timestamp = System.currentTimeMillis();
    }

    // Class Inner untuk Komentar
    public static class Comment {
        public String author;
        public String text;

        public Comment() {}
        public Comment(String author, String text) {
            this.author = author;
            this.text = text;
        }
    }
}
