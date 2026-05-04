# Etapa 1: Compilar la aplicación con Maven
FROM maven:3.8.5-openjdk-17-slim AS build
COPY . .
RUN mvn clean package -DskipTests

# Etapa 2: Ejecutar la aplicación en una imagen ligera de Java
FROM openjdk:17-slim
COPY --from=build /target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]