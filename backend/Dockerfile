FROM golang:1.22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o server .

FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache sqlite
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
