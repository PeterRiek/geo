FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon || true
COPY src ./src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /app/build/libs/*.jar app.jar
# /app/uploads is a volume mount point (see docker-compose.yml). Docker seeds a
# fresh named volume from whatever's at that path in the image, ownership
# included — pre-create it owned by spring, otherwise the volume comes up
# root-owned and the app (running as spring) can't write to it.
RUN mkdir -p uploads/coordinates uploads/images && chown -R spring:spring uploads
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
