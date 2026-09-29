# Clean previous build
Remove-Item -Recurse -Force ..\build\lambda -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path ..\build\lambda | Out-Null

# Copy your code
Copy-Item -Recurse app ..\build\lambda\app
Copy-Item handler.py ..\build\lambda\handler.py

# Install production deps only
$prodReqs = @(
    "fastapi==0.115.0",
    "mangum==0.18.0",
    "boto3==1.35.0",
    "pydantic==2.9.0"
)
$prodReqs | Out-File -Encoding ascii ..\build\prod-requirements.txt
pip install -r ..\build\prod-requirements.txt -t ..\build\lambda `
    --platform manylinux2014_x86_64 `
    --python-version 3.12 `
    --implementation cp `
    --only-binary=:all: `
    --upgrade

# Remove everything that shouldn't ship to Lambda
Remove-Item -Recurse -Force ..\build\lambda\bin -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ..\build\lambda\Scripts -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ..\build\lambda\Include -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ..\build\lambda\Lib -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ..\build\lambda\app\__pycache__ -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ..\build\lambda\__pycache__ -ErrorAction SilentlyContinue
Get-ChildItem ..\build\lambda -Recurse -Include *.pyd,*.dll -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Report size and contents
$size = (Get-ChildItem ..\build\lambda -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "`nBuild complete: ..\build\lambda" -ForegroundColor Green
Write-Host ("Total size: {0:N1} MB" -f $size) -ForegroundColor Green
Write-Host "`nContents:" -ForegroundColor Green
Get-ChildItem ..\build\lambda | Select-Object -ExpandProperty Name