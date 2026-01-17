package com.clayplay.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class ExhibitionResponse {
    public Long id;
    public String title;
    public String location;
    public OffsetDateTime startDateTime;
    public Long organizerId;
    public List<String> imageUrls;
}
