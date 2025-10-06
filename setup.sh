#!/bin/bash

# Multiplayer Game Platform - Automated Setup Script
# This script handles the complete setup process with fallback options

set -e  # Exit on error

echo "🎮 Multiplayer Game Platform - Setup Script"
echo "============================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js v$(node -v) detected"
            return 0
        else
            print_warning "Node.js version $(node -v) detected, but v18+ is recommended"
            return 1
        fi
    else
        print_error "Node.js not found"
        return 1
    fi
}

# Setup environment files
setup_env_files() {
    print_info "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env"
    else
        print_info "backend/.env already exists (skipping)"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        print_success "Created frontend/.env"
    else
        print_info "frontend/.env already exists (skipping)"
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Backend
    print_info "Installing backend dependencies..."
    cd backend
    npm install --silent
    cd ..
    print_success "Backend dependencies installed"
    
    # Frontend
    print_info "Installing frontend dependencies..."
    cd frontend
    npm install --silent
    cd ..
    print_success "Frontend dependencies installed"
}

# Check Docker availability
check_docker() {
    if command_exists docker && command_exists docker-compose; then
        # Test if Docker is actually working
        if docker ps >/dev/null 2>&1; then
            print_success "Docker is available and working"
            return 0
        else
            print_warning "Docker is installed but not working properly"
            return 1
        fi
    else
        print_warning "Docker/Docker Compose not found"
        return 1
    fi
}

# Try to fix Docker runtime issue
fix_docker_runtime() {
    print_info "Checking Docker runtime configuration..."
    
    if [ -f "/etc/docker/daemon.json" ]; then
        if grep -q "nvidia" /etc/docker/daemon.json 2>/dev/null; then
            print_warning "Docker is configured to use nvidia-container-runtime"
            print_info "Attempting to fix Docker configuration..."
            
            # Backup original config
            sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup 2>/dev/null || true
            
            # Remove nvidia runtime from config
            sudo sed -i 's/"default-runtime": "nvidia",//g' /etc/docker/daemon.json 2>/dev/null || true
            sudo sed -i '/"nvidia":/,/}/d' /etc/docker/daemon.json 2>/dev/null || true
            
            # Restart Docker
            print_info "Restarting Docker service..."
            sudo systemctl restart docker 2>/dev/null || true
            sleep 2
            
            if docker ps >/dev/null 2>&1; then
                print_success "Docker runtime fixed!"
                return 0
            fi
        fi
    fi
    
    return 1
}

# Start with Docker
start_with_docker() {
    print_info "Starting services with Docker Compose..."
    
    # Try to fix Docker if needed
    if ! docker ps >/dev/null 2>&1; then
        print_warning "Docker not working, attempting to fix..."
        if ! fix_docker_runtime; then
            print_error "Could not fix Docker runtime"
            return 1
        fi
    fi
    
    # Start containers
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    
    # Wait for services to start
    print_info "Waiting for services to start..."
    sleep 5
    
    # Check if services are running
    if curl -s http://localhost:4001/health >/dev/null 2>&1 && \
       curl -s http://localhost:4000 >/dev/null 2>&1; then
        print_success "All services started successfully with Docker!"
        return 0
    else
        print_error "Services failed to start with Docker"
        docker-compose logs --tail=50
        return 1
    fi
}

# Start with local Node.js
start_with_local() {
    print_info "Starting services with local Node.js..."
    
    # Check if Redis is available (optional)
    if command_exists redis-server; then
        print_info "Starting Redis..."
        redis-server --daemonize yes --port 6379 2>/dev/null || true
        print_success "Redis started"
    else
        print_warning "Redis not found (optional - continuing without it)"
    fi
    
    # Start backend
    print_info "Starting backend server..."
    cd backend
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    echo $BACKEND_PID > .backend.pid
    
    # Wait for backend to start
    sleep 3
    
    if ! curl -s http://localhost:4001/health >/dev/null 2>&1; then
        print_error "Backend failed to start"
        cat backend.log
        return 1
    fi
    print_success "Backend started (PID: $BACKEND_PID)"
    
    # Start frontend
    print_info "Starting frontend server..."
    cd frontend
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    echo $FRONTEND_PID > .frontend.pid
    
    # Wait for frontend to start
    sleep 5
    
    if ! curl -s http://localhost:4000 >/dev/null 2>&1; then
        print_error "Frontend failed to start"
        cat frontend.log
        return 1
    fi
    print_success "Frontend started (PID: $FRONTEND_PID)"
    
    return 0
}

# Main setup flow
main() {
    echo ""
    print_info "Step 1: Checking prerequisites..."
    
    # Check Node.js
    if ! check_node_version; then
        print_error "Node.js v18+ is required. Please install it first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    echo ""
    print_info "Step 2: Setting up environment files..."
    setup_env_files
    
    echo ""
    print_info "Step 3: Installing dependencies..."
    install_dependencies
    
    echo ""
    print_info "Step 4: Starting services..."
    
    # Try Docker first, fallback to local
    if check_docker; then
        echo ""
        print_info "Docker detected. Choose installation method:"
        echo "  1) Docker Compose (recommended for production)"
        echo "  2) Local Development (recommended for development)"
        echo ""
        read -p "Enter choice (1 or 2, default: 2): " choice
        choice=${choice:-2}
        
        if [ "$choice" = "1" ]; then
            if start_with_docker; then
                SETUP_METHOD="docker"
            else
                print_warning "Docker setup failed, falling back to local development..."
                if start_with_local; then
                    SETUP_METHOD="local"
                else
                    print_error "Setup failed"
                    exit 1
                fi
            fi
        else
            if start_with_local; then
                SETUP_METHOD="local"
            else
                print_error "Setup failed"
                exit 1
            fi
        fi
    else
        print_info "Docker not available, using local development setup..."
        if start_with_local; then
            SETUP_METHOD="local"
        else
            print_error "Setup failed"
            exit 1
        fi
    fi
    
    # Success message
    echo ""
    echo "============================================"
    print_success "Setup completed successfully!"
    echo "============================================"
    echo ""
    print_info "🌐 Frontend: http://localhost:4000"
    print_info "🔧 Backend:  http://localhost:4001"
    echo ""
    
    if [ "$SETUP_METHOD" = "local" ]; then
        print_info "Running in LOCAL mode"
        print_warning "To stop servers, run: ./stop.sh"
        echo ""
        print_info "Server logs:"
        echo "  - Backend: tail -f backend.log"
        echo "  - Frontend: tail -f frontend.log"
    else
        print_info "Running in DOCKER mode"
        print_warning "To stop servers, run: docker-compose down"
        echo ""
        print_info "View logs: docker-compose logs -f"
    fi
    
    echo ""
    print_info "Next steps:"
    echo "  1. Open http://localhost:4000 in your browser"
    echo "  2. Click 'Create Room' to start a game"
    echo "  3. Open another browser tab to join as a second player"
    echo ""
}

# Run main function
main
