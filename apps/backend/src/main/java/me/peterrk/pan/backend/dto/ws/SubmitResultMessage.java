package me.peterrk.pan.backend.dto.ws;

public class SubmitResultMessage {
  public static class Data {
    public LatLng guessLocation;

  }

  public String type = "SUBMIT_RESULT";
  public Data data;
}
