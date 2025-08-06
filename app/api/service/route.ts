import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { url, firecrawlApiKey, openaiApiKey, config } = await request.json();

    // API 키 처리: 사용자 제공 키 또는 환경변수 사용
    const finalFirecrawlKey = firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
    const finalOpenaiKey = openaiApiKey || process.env.OPENAI_API_KEY;

    if (!finalFirecrawlKey || !finalOpenaiKey) {
      return NextResponse.json(
        { error: 'Both Firecrawl and OpenAI API keys are required' },
        { status: 400 }
      );
    }

    // Python 가상환경 및 스크립트 경로 설정
    const fcPyDir = path.join(process.cwd(), 'fc-py');
    const scriptPath = path.join(fcPyDir, 'generate-llmstxt.py');
    const outputDir = path.join(process.cwd(), 'temp');
    
    // 가상환경 Python 경로 설정 (플랫폼별)
    const isWindows = process.platform === 'win32';
    const venvPythonPath = isWindows 
      ? path.join(fcPyDir, '.venv', 'Scripts', 'python.exe')
      : path.join(fcPyDir, '.venv', 'bin', 'python');
    
    // 가상환경 Python이 없으면 시스템 Python 사용
    const pythonCommand = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';
    
    // 임시 출력 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Python 스크립트 실행 인자 구성
    const args = [
      'generate-llmstxt.py',  // 상대 경로로 변경
      url,
      '--firecrawl-api-key', finalFirecrawlKey,
      '--openai-api-key', finalOpenaiKey,
      '--output-dir', outputDir
    ];

    // config 파일이 있으면 추가
    const configPath = path.join(fcPyDir, 'config.yaml');
    if (fs.existsSync(configPath)) {
      args.push('--config', 'config.yaml');  // 상대 경로로 변경
    }

    console.log('Executing Python script with command:', pythonCommand);
    console.log('Working directory:', fcPyDir);
    console.log('Args:', args);

    // Python 스크립트 실행
    const result = await new Promise<{ llmstxt: string }>((resolve, reject) => {
      const pythonProcess = spawn(pythonCommand, args, {
        cwd: fcPyDir,  // fc-py 폴더에서 실행
        env: {
          ...process.env,
          FIRECRAWL_API_KEY: finalFirecrawlKey,
          OPENAI_API_KEY: finalOpenaiKey,
          FIRECRAWL_BASE_URL: process.env.FIRECRAWL_BASE_URL || config?.firecrawl_base_url
        }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('Python stdout:', data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('Python stderr:', data.toString());
      });

      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}. Error: ${stderr}`));
          return;
        }

        try {
          // 도메인 추출하여 파일명 생성
          const domain = new URL(url).hostname.replace('www.', '');
          const llmsFilePath = path.join(outputDir, `${domain}-llms.txt`);

          // 생성된 파일 읽기
          const llmstxt = await readFile(llmsFilePath, 'utf-8');

          // 임시 파일 정리
          try {
            await unlink(llmsFilePath);
          } catch (cleanupError) {
            console.warn('Failed to cleanup temp files:', cleanupError);
          }

          resolve({ llmstxt });
        } catch (fileError) {
          reject(new Error(`Failed to read output files: ${fileError instanceof Error ? fileError.message : String(fileError)}`));
        }
      });
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Python backend error:', error);
    return NextResponse.json(
      { error: 'Python backend execution failed', details: error.message },
      { status: 500 }
    );
  }
}
