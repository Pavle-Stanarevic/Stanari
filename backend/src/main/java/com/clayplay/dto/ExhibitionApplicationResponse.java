package com.clayplay.dto;

public class ExhibitionApplicationResponse {
    public Long exhibitionId;
    public String status;

    public ExhibitionApplicationResponse() {}

    public ExhibitionApplicationResponse(Long exhibitionId, String status) {
        this.exhibitionId = exhibitionId;
        this.status = status;
    }
}