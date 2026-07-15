#include "httplib.h"
#include "json.hpp"
#include "solver.hpp"
#include <iostream>
#include <string>

using json = nlohmann::json;

// Helper to configure standard CORS headers
void setCorsHeaders(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
}

// Parse request payload into Solver::Grid
Solver::Grid parseGridFromJson(const json& j) {
    int w = j["width"];
    int h = j["height"];
    
    Solver::Grid grid(w, h);
    
    int startX = j["start"]["x"];
    int startY = j["start"]["y"];
    int goalX = j["goal"]["x"];
    int goalY = j["goal"]["y"];
    
    grid.start = grid.getCell(startX, startY);
    grid.goal = grid.getCell(goalX, goalY);
    
    auto jGrid = j["grid"];
    for (int y = 0; y < h; ++y) {
        for (int x = 0; x < w; ++x) {
            std::string terrain = jGrid[y][x];
            double weight = 1.0;
            
            if (terrain == "grass") {
                weight = 2.0;
            } else if (terrain == "mud") {
                weight = 5.0;
            } else if (terrain == "water") {
                weight = std::numeric_limits<double>::infinity();
            }
            
            Solver::Cell* cell = grid.getCell(x, y);
            if (cell) {
                cell->terrain = terrain;
                cell->weight = weight;
            }
        }
    }
    
    // Safety check: ensure start/goal are passable roads
    if (grid.start) {
        grid.start->terrain = "road";
        grid.start->weight = 1.0;
    }
    if (grid.goal) {
        grid.goal->terrain = "road";
        grid.goal->weight = 1.0;
    }
    
    return grid;
}

// Convert Solver::SearchResult to json object
json serializeResult(const Solver::SearchResult& result) {
    json j;
    j["success"] = result.success;
    j["nodesExpanded"] = result.nodesExpanded;
    j["pathCost"] = result.pathCost;
    j["executionTime"] = result.executionTime;
    
    json jVisited = json::array();
    for (const auto& p : result.visitedOrder) {
        jVisited.push_back({{"x", p.first}, {"y", p.second}});
    }
    j["visitedOrder"] = jVisited;
    
    json jPath = json::array();
    if (result.success) {
        for (const auto& p : result.path) {
            jPath.push_back({{"x", p.first}, {"y", p.second}});
        }
    }
    j["path"] = jPath;
    
    return j;
}

int main() {
    httplib::Server svr;

    // Handle browser pre-flight OPTIONS request
    svr.Options(R"(.*)", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        res.status = 200;
    });

    // Health check endpoint
    svr.Get("/health", [](const httplib::Request&, httplib::Response& res) {
        setCorsHeaders(res);
        json response;
        response["status"] = "ok";
        response["message"] = "C++ Pathfinding Backend is fully operational";
        res.set_content(response.dump(), "application/json");
    });

    // Solve endpoint
    svr.Post("/solve", [](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        try {
            json j = json::parse(req.body);
            std::string algo = j["algorithm"];
            
            Solver::Grid grid = parseGridFromJson(j);
            Solver::SearchResult result;
            
            if (algo == "bfs") {
                result = Solver::bfs(grid);
            } else if (algo == "dfs") {
                result = Solver::dfs(grid);
            } else if (algo == "dijkstra") {
                result = Solver::dijkstra(grid);
            } else if (algo == "greedy") {
                result = Solver::greedy(grid);
            } else if (algo == "astar") {
                result = Solver::astar(grid);
            } else {
                res.status = 400;
                res.set_content("{\"error\":\"Invalid algorithm\"}", "application/json");
                return;
            }
            
            res.set_content(serializeResult(result).dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            json err;
            err["error"] = e.what();
            res.set_content(err.dump(), "application/json");
        }
    });

    // Comparison endpoint
    svr.Post("/compare", [](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        try {
            json j = json::parse(req.body);
            Solver::Grid grid = parseGridFromJson(j);
            
            json response;
            
            std::vector<std::string> algorithms = {"bfs", "dfs", "dijkstra", "greedy", "astar"};
            for (const auto& key : algorithms) {
                Solver::SearchResult result;
                if (key == "bfs") {
                    result = Solver::bfs(grid);
                } else if (key == "dfs") {
                    result = Solver::dfs(grid);
                } else if (key == "dijkstra") {
                    result = Solver::dijkstra(grid);
                } else if (key == "greedy") {
                    result = Solver::greedy(grid);
                } else if (key == "astar") {
                    result = Solver::astar(grid);
                }
                response[key] = serializeResult(result);
            }
            
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            json err;
            err["error"] = e.what();
            res.set_content(err.dump(), "application/json");
        }
    });

    std::cout << "C++ Pathfinding Server starting on http://localhost:8080..." << std::endl;
    svr.listen("0.0.0.0", 8080);
    return 0;
}
