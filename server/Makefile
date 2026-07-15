CXX = clang++
CXXFLAGS = -std=c++17 -O3 -Wall -Wextra -pthread

TARGET = solver_server
SRC = server.cpp

all: $(TARGET)

$(TARGET): $(SRC) solver.hpp httplib.h json.hpp
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET)

clean:
	rm -f $(TARGET)
