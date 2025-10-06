# Docker Runtime Fix Guide

## Problem: nvidia-container-runtime Error

If you encounter this error when running Docker:
```
exec: "nvidia-container-runtime": executable file not found in $PATH
```

This means Docker is configured to use the NVIDIA container runtime, but it's not installed on your system.

## Quick Fix (Recommended)

Run the automated setup script which will attempt to fix this:
```bash
chmod +x setup.sh
./setup.sh
```

The script will automatically detect and fix the Docker runtime issue.

## Manual Fix

### Option 1: Remove NVIDIA Runtime Configuration

1. **Backup Docker configuration:**
   ```bash
   sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
   ```

2. **Edit Docker daemon configuration:**
   ```bash
   sudo nano /etc/docker/daemon.json
   ```

3. **Remove or comment out NVIDIA-related lines:**
   
   **Before:**
   ```json
   {
     "default-runtime": "nvidia",
     "runtimes": {
       "nvidia": {
         "path": "nvidia-container-runtime",
         "runtimeArgs": []
       }
     }
   }
   ```
   
   **After:**
   ```json
   {
     "runtimes": {}
   }
   ```
   
   Or simply delete the file if it only contains NVIDIA configuration:
   ```bash
   sudo rm /etc/docker/daemon.json
   ```

4. **Restart Docker:**
   ```bash
   sudo systemctl restart docker
   ```

5. **Verify Docker works:**
   ```bash
   docker ps
   ```

### Option 2: Install NVIDIA Container Runtime (If you have NVIDIA GPU)

If you actually need NVIDIA GPU support:

```bash
# Add NVIDIA repository
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# Install nvidia-container-runtime
sudo apt-get update
sudo apt-get install -y nvidia-container-runtime

# Restart Docker
sudo systemctl restart docker
```

### Option 3: Use Local Development (Bypass Docker)

If Docker continues to have issues, use local Node.js development:

```bash
# Run the setup script and choose option 2
./setup.sh

# Or manually:
cd backend
cp .env.example .env
npm install
npm run dev &

cd ../frontend
cp .env.example .env
npm install
npm run dev &
```

## Verification

After applying the fix, verify Docker works:

```bash
# Test Docker
docker run --rm hello-world

# Test docker-compose
docker-compose --version

# Start the application
docker-compose up -d
```

## Prevention

To prevent this issue on new systems:

1. Don't configure NVIDIA runtime unless you have NVIDIA GPUs
2. Use the automated `setup.sh` script which handles fallbacks
3. Keep Docker daemon configuration minimal

## Related Issues

- Docker daemon not starting: `sudo systemctl status docker`
- Permission denied: Add user to docker group: `sudo usermod -aG docker $USER`
- Port conflicts: Check ports 4000, 4001, 6379 are free

## Support

If issues persist:
1. Check Docker logs: `sudo journalctl -u docker.service`
2. Verify Docker installation: `docker info`
3. Use local development setup as fallback
