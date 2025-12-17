"""
Git Service - Git command execution and project management
"""
import subprocess
from pathlib import Path
from typing import Optional
from app.config import BASE_PROJECT_PATH, PROJECT_GIT_MAPPING


def run_git_command(command: list[str], cwd: str | Path) -> tuple[bool, str]:
    """
    Execute a git command in the specified directory

    Returns:
        tuple: (success: bool, output: str)
    """
    try:
        result = subprocess.run(
            ["git"] + command,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30
        )
        output = result.stdout if result.returncode == 0 else result.stderr
        return result.returncode == 0, output.strip()
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)


def get_git_config(project_path: str | Path, key: str) -> Optional[str]:
    """Get a git config value"""
    success, output = run_git_command(["config", "--get", key], project_path)
    return output if success else None


def set_git_config(project_path: str | Path, key: str, value: str) -> bool:
    """Set a git config value"""
    success, _ = run_git_command(["config", key, value], project_path)
    return success


def get_current_git_user(project_path: str | Path) -> dict:
    """Get current git user config for a project"""
    return {
        "email": get_git_config(project_path, "user.email"),
        "name": get_git_config(project_path, "user.name")
    }


def set_git_user(project_path: str | Path, email: str, name: str) -> bool:
    """Set git user for a project"""
    email_ok = set_git_config(project_path, "user.email", email)
    name_ok = set_git_config(project_path, "user.name", name)
    return email_ok and name_ok


def get_git_status(project_path: str | Path) -> dict:
    """Get git status for a project"""
    success, output = run_git_command(["status", "--porcelain"], project_path)

    if not success:
        return {"error": output}

    # Parse status
    changes = []
    for line in output.split("\n"):
        if line.strip():
            status = line[:2]
            file = line[3:]
            changes.append({"status": status, "file": file})

    # Get current branch
    _, branch = run_git_command(["branch", "--show-current"], project_path)

    return {
        "branch": branch,
        "changes": changes,
        "has_changes": len(changes) > 0
    }


def verify_git_user_for_project(project_code: str) -> dict:
    """
    Verify that git user is correctly configured for a project

    Returns:
        dict with keys: valid, current, expected, message
    """
    # Get expected config
    expected = PROJECT_GIT_MAPPING.get(project_code)
    if not expected:
        return {
            "valid": False,
            "message": f"Unknown project: {project_code}"
        }

    project_path = Path(expected["path"])
    if not project_path.exists():
        return {
            "valid": False,
            "message": f"Project path not found: {project_path}"
        }

    # Get current config
    current = get_current_git_user(project_path)

    # Compare
    email_match = current["email"] == expected["email"]
    name_match = current["name"] == expected["name"]

    return {
        "valid": email_match and name_match,
        "current": current,
        "expected": {"email": expected["email"], "name": expected["name"]},
        "message": "OK" if (email_match and name_match) else "Git user mismatch!"
    }


def fix_git_user_for_project(project_code: str) -> dict:
    """
    Fix git user configuration for a project

    Returns:
        dict with success status
    """
    expected = PROJECT_GIT_MAPPING.get(project_code)
    if not expected:
        return {"success": False, "message": f"Unknown project: {project_code}"}

    project_path = Path(expected["path"])
    success = set_git_user(project_path, expected["email"], expected["name"])

    if success:
        return {
            "success": True,
            "message": f"Git user set to {expected['name']} <{expected['email']}>"
        }
    else:
        return {"success": False, "message": "Failed to set git user"}


def detect_project_from_path(path: str | Path) -> Optional[str]:
    """
    Detect project code from a file path

    Example: d:/cbt/koreanews/src/app/page.tsx -> koreanews
    """
    path = Path(path)

    for project_code, config in PROJECT_GIT_MAPPING.items():
        project_path = Path(config["path"])
        try:
            # Check if path is under project directory
            path.relative_to(project_path)
            return project_code
        except ValueError:
            continue

    return None


def scan_projects(base_path: str | Path = None) -> list[dict]:
    """
    Scan base directory for projects (directories with .git folder)
    """
    base_path = Path(base_path or BASE_PROJECT_PATH)
    projects = []

    for item in base_path.iterdir():
        if item.is_dir() and (item / ".git").exists():
            git_user = get_current_git_user(item)
            git_status = get_git_status(item)

            projects.append({
                "code": item.name,
                "path": str(item),
                "git_email": git_user.get("email"),
                "git_name": git_user.get("name"),
                "branch": git_status.get("branch"),
                "has_changes": git_status.get("has_changes", False)
            })

    return projects
