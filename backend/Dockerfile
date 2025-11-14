# --------- Build stage ---------
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# --------- Run stage ---------
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Kopiraj buildani JAR iz build stagea
COPY --from=build /app/target/*.jar app.jar

# Render će ti poslati PORT u env varijabli PORT
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
