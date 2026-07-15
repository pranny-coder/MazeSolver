#pragma once


#include <vector>
#include <string>
#include <queue>
#include <stack>
#include <unordered_set>
#include <unordered_map>
#include <cmath>
#include <limits>
#include <chrono>
#include <algorithm>

namespace Solver {

struct Cell {
    int x;
    int y;
    std::string terrain;
    double weight;
    
    // Search flags
    bool visited = false;
    bool frontier = false;
    double g = std::numeric_limits<double>::infinity();
    double h = std::numeric_limits<double>::infinity();
    double f = std::numeric_limits<double>::infinity();
    Cell* parent = nullptr;

    bool operator==(const Cell& other) const {
        return x == other.x && y == other.y;
    }
};

// Hash function for Cell* to use in unordered_set
struct CellPtrHash {
    std::size_t operator()(const Cell* cell) const {
        if (!cell) return 0;
        return std::hash<int>()(cell->x) ^ (std::hash<int>()(cell->y) << 1);
    }
};

struct CellPtrEq {
    bool operator()(const Cell* a, const Cell* b) const {
        return a->x == b->x && a->y == b->y;
    }
};

class Grid {
public:
    int width;
    int height;
    std::vector<std::vector<Cell>> cells;
    Cell* start = nullptr;
    Cell* goal = nullptr;

    Grid(int w, int h) : width(w), height(h) {
        cells.resize(height, std::vector<Cell>(width));
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                cells[y][x].x = x;
                cells[y][x].y = y;
                cells[y][x].terrain = "road";
                cells[y][x].weight = 1.0;
            }
        }
        start = &cells[1][1];
        goal = &cells[height - 2][width - 2];
    }

    Cell* getCell(int x, int y) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            return &cells[y][x];
        }
        return nullptr;
    }

    std::vector<Cell*> getNeighbors(Cell* cell) {
        std::vector<Cell*> neighbors;
        // Direction vectors (Up, Right, Down, Left)
        int dirs[4][2] = {{0, -1}, {1, 0}, {0, 1}, {-1, 0}};
        for (auto& d : dirs) {
            int nx = cell->x + d[0];
            int ny = cell->y + d[1];
            Cell* neighbor = getCell(nx, ny);
            if (neighbor && neighbor->weight < std::numeric_limits<double>::infinity()) {
                neighbors.push_back(neighbor);
            }
        }
        return neighbors;
    }

    void resetSearch() {
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                Cell& cell = cells[y][x];
                cell.visited = false;
                cell.frontier = false;
                cell.g = std::numeric_limits<double>::infinity();
                cell.h = std::numeric_limits<double>::infinity();
                cell.f = std::numeric_limits<double>::infinity();
                cell.parent = nullptr;
            }
        }
    }
};

struct SearchResult {
    std::vector<std::pair<int, int>> visitedOrder;
    std::vector<std::pair<int, int>> path;
    int nodesExpanded = 0;
    double pathCost = 0.0;
    double executionTime = 0.0; // milliseconds
    bool success = false;
};

// Heuristic calculation (Manhattan Distance)
inline double getHeuristic(Cell* a, Cell* b) {
    return std::abs(a->x - b->x) + std::abs(a->y - b->y);
}

// Reconstruct path helper
inline std::vector<std::pair<int, int>> reconstructPath(Cell* goal) {
    std::vector<std::pair<int, int>> path;
    Cell* curr = goal;
    while (curr) {
        path.push_back({curr->x, curr->y});
        curr = curr->parent;
    }
    std::reverse(path.begin(), path.end());
    return path;
}

// 1. BFS Algorithm
inline SearchResult bfs(Grid& grid) {
    auto startTime = std::chrono::high_resolution_clock::now();
    grid.resetSearch();

    SearchResult result;
    std::queue<Cell*> q;
    
    Cell* start = grid.start;
    Cell* goal = grid.goal;
    
    q.push(start);
    start->frontier = true;

    while (!q.empty()) {
        Cell* current = q.front();
        q.pop();
        
        result.visitedOrder.push_back({current->x, current->y});
        current->visited = true;

        if (current == goal) {
            result.success = true;
            break;
        }

        std::vector<Cell*> neighbors = grid.getNeighbors(current);
        for (Cell* neighbor : neighbors) {
            if (!neighbor->frontier) {
                neighbor->frontier = true;
                neighbor->parent = current;
                q.push(neighbor);
            }
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    result.nodesExpanded = result.visitedOrder.size();

    if (result.success) {
        result.path = reconstructPath(goal);
        double cost = 0.0;
        for (size_t i = 1; i < result.path.size(); ++i) {
            cost += grid.getCell(result.path[i].first, result.path[i].second)->weight;
        }
        result.pathCost = cost;
    }
    
    return result;
}

// 2. DFS Algorithm
inline SearchResult dfs(Grid& grid) {
    auto startTime = std::chrono::high_resolution_clock::now();
    grid.resetSearch();

    SearchResult result;
    std::vector<Cell*> stack;
    
    Cell* start = grid.start;
    Cell* goal = grid.goal;
    
    stack.push_back(start);
    start->frontier = true;

    while (!stack.empty()) {
        Cell* current = stack.back();
        stack.pop_back();
        
        result.visitedOrder.push_back({current->x, current->y});
        current->visited = true;

        if (current == goal) {
            result.success = true;
            break;
        }

        std::vector<Cell*> neighbors = grid.getNeighbors(current);
        for (int i = static_cast<int>(neighbors.size()) - 1; i >= 0; --i) {
            Cell* neighbor = neighbors[i];
            if (!neighbor->frontier) {
                neighbor->frontier = true;
                neighbor->parent = current;
                stack.push_back(neighbor);
            }
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    result.nodesExpanded = result.visitedOrder.size();

    if (result.success) {
        result.path = reconstructPath(goal);
        double cost = 0.0;
        for (size_t i = 1; i < result.path.size(); ++i) {
            cost += grid.getCell(result.path[i].first, result.path[i].second)->weight;
        }
        result.pathCost = cost;
    }
    
    return result;
}

// 3. Dijkstra's Algorithm
struct DijkstraEntry {
    Cell* cell;
    double g;
    uint64_t id;
};

struct DijkstraCompare {
    bool operator()(const DijkstraEntry& a, const DijkstraEntry& b) const {
        if (a.g == b.g) {
            return a.id > b.id; // stable FIFO ordering
        }
        return a.g > b.g;
    }
};

inline SearchResult dijkstra(Grid& grid) {
    auto startTime = std::chrono::high_resolution_clock::now();
    grid.resetSearch();

    SearchResult result;
    std::priority_queue<DijkstraEntry, std::vector<DijkstraEntry>, DijkstraCompare> pq;
    uint64_t pushCount = 0;
    
    Cell* start = grid.start;
    Cell* goal = grid.goal;
    
    start->g = 0.0;
    pq.push({start, 0.0, pushCount++});

    while (!pq.empty()) {
        DijkstraEntry currentEntry = pq.top();
        pq.pop();
        Cell* current = currentEntry.cell;

        if (current->visited) continue;
        current->visited = true;
        result.visitedOrder.push_back({current->x, current->y});

        if (current == goal) {
            result.success = true;
            break;
        }

        std::vector<Cell*> neighbors = grid.getNeighbors(current);
        for (Cell* neighbor : neighbors) {
            if (neighbor->visited) continue;

            double tentativeG = current->g + neighbor->weight;
            if (tentativeG < neighbor->g) {
                neighbor->g = tentativeG;
                neighbor->parent = current;
                pq.push({neighbor, tentativeG, pushCount++});
            }
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    result.nodesExpanded = result.visitedOrder.size();

    if (result.success) {
        result.path = reconstructPath(goal);
        result.pathCost = goal->g;
    }
    
    return result;
}

// 4. Greedy Best-First Search
struct GreedyEntry {
    Cell* cell;
    double h;
    uint64_t id;
};

struct GreedyCompare {
    bool operator()(const GreedyEntry& a, const GreedyEntry& b) const {
        if (a.h == b.h) {
            return a.id > b.id; // stable FIFO ordering
        }
        return a.h > b.h;
    }
};

inline SearchResult greedy(Grid& grid) {
    auto startTime = std::chrono::high_resolution_clock::now();
    grid.resetSearch();

    SearchResult result;
    std::priority_queue<GreedyEntry, std::vector<GreedyEntry>, GreedyCompare> pq;
    uint64_t pushCount = 0;
    
    Cell* start = grid.start;
    Cell* goal = grid.goal;
    
    start->h = getHeuristic(start, goal);
    pq.push({start, start->h, pushCount++});
    start->frontier = true;

    while (!pq.empty()) {
        GreedyEntry currentEntry = pq.top();
        pq.pop();
        Cell* current = currentEntry.cell;

        if (current->visited) continue;
        current->visited = true;
        result.visitedOrder.push_back({current->x, current->y});

        if (current == goal) {
            result.success = true;
            break;
        }

        std::vector<Cell*> neighbors = grid.getNeighbors(current);
        for (Cell* neighbor : neighbors) {
            if (neighbor->visited || neighbor->frontier) continue;

            neighbor->h = getHeuristic(neighbor, goal);
            neighbor->parent = current;
            pq.push({neighbor, neighbor->h, pushCount++});
            neighbor->frontier = true;
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    result.nodesExpanded = result.visitedOrder.size();

    if (result.success) {
        result.path = reconstructPath(goal);
        double cost = 0.0;
        for (size_t i = 1; i < result.path.size(); ++i) {
            cost += grid.getCell(result.path[i].first, result.path[i].second)->weight;
        }
        result.pathCost = cost;
    }
    
    return result;
}

// 5. A* Search Algorithm
struct AStarEntry {
    Cell* cell;
    double f;
    double h;
    uint64_t id;
};

struct AStarCompare {
    bool operator()(const AStarEntry& a, const AStarEntry& b) const {
        if (a.f == b.f) {
            if (a.h == b.h) {
                return a.id > b.id; // stable FIFO ordering
            }
            return a.h > b.h;
        }
        return a.f > b.f;
    }
};

inline SearchResult astar(Grid& grid) {
    auto startTime = std::chrono::high_resolution_clock::now();
    grid.resetSearch();

    SearchResult result;
    std::priority_queue<AStarEntry, std::vector<AStarEntry>, AStarCompare> pq;
    uint64_t pushCount = 0;
    
    Cell* start = grid.start;
    Cell* goal = grid.goal;
    
    start->g = 0.0;
    start->h = getHeuristic(start, goal);
    start->f = start->g + start->h;
    pq.push({start, start->f, start->h, pushCount++});

    while (!pq.empty()) {
        AStarEntry currentEntry = pq.top();
        pq.pop();
        Cell* current = currentEntry.cell;

        if (current->visited) continue;
        current->visited = true;
        result.visitedOrder.push_back({current->x, current->y});

        if (current == goal) {
            result.success = true;
            break;
        }

        std::vector<Cell*> neighbors = grid.getNeighbors(current);
        for (Cell* neighbor : neighbors) {
            if (neighbor->visited) continue;

            double tentativeG = current->g + neighbor->weight;
            if (tentativeG < neighbor->g) {
                neighbor->g = tentativeG;
                neighbor->h = getHeuristic(neighbor, goal);
                neighbor->f = neighbor->g + neighbor->h;
                neighbor->parent = current;
                pq.push({neighbor, neighbor->f, neighbor->h, pushCount++});
            }
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    result.nodesExpanded = result.visitedOrder.size();

    if (result.success) {
        result.path = reconstructPath(goal);
        result.pathCost = goal->g;
    }
    
    return result;
}

} // namespace Solver
