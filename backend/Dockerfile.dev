# Koristimo Temurin JDK 25 (službena slika s podrškom za Java 25)
FROM eclipse-temurin:25-jdk

# Instaliramo Maven ručno
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Kopiramo Maven konfiguraciju i source
COPY pom.xml mvnw ./
COPY .mvn .mvn
COPY src ./src

# Pokrećemo build (da preuzmemo dependencye u cache)
RUN mvn -DskipTests package

EXPOSE 8080

# Pokreni Spring Boot aplikaciju
CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.fork=false"]
