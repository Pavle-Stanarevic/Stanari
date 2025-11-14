package com.clayplay.dto;

import java.time.OffsetDateTime;

public class WorkshopResponse {
    private Long id;
    private String title;
    private String description;
    private Integer durationMinutes;
    private OffsetDateTime startDateTime;
    private String location;
    private Integer capacity;
    private Double price;
    private Long organizerId;

    public WorkshopResponse() {}

    public WorkshopResponse(Long id, String title, String description, Integer durationMinutes,
                            OffsetDateTime startDateTime, String location, Integer capacity,
                            Double price, Long organizerId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.startDateTime = startDateTime;
        this.location = location;
        this.capacity = capacity;
        this.price = price;
        this.organizerId = organizerId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public OffsetDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(OffsetDateTime startDateTime) { this.startDateTime = startDateTime; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Long getOrganizerId() { return organizerId; }
    public void setOrganizerId(Long organizerId) { this.organizerId = organizerId; }
}
