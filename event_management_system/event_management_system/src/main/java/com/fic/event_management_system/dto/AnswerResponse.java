package com.fic.event_management_system.dto;

public class AnswerResponse {

private String question;
private String answer;

public AnswerResponse() {
}

public AnswerResponse(String question, String answer) {
    this.question = question;
    this.answer = answer;
}

public String getQuestion() {
    return question;
}

public void setQuestion(String question) {
    this.question = question;
}

public String getAnswer() {
    return answer;
}

public void setAnswer(String answer) {
    this.answer = answer;
}

}
