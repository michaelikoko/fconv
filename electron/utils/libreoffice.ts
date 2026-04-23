import { execSync, spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { BrowserWindow } from 'electron'
import { isLibreOfficeDocumentExt, isLibreOfficePresentationExt, isLibreOfficeSpreadsheetExt, LIBREOFFICE_EXTENSIONS } from '../../shared/fileFormats'


export const DOCUMENT_EXTENSION_VALUES = [
    ...LIBREOFFICE_EXTENSIONS.DOCUMENTS,
    ...LIBREOFFICE_EXTENSIONS.SPREADSHEETS,
    ...LIBREOFFICE_EXTENSIONS.PRESENTATIONS,
    ...LIBREOFFICE_EXTENSIONS.PDF,
] as const

export type DocumentType = (typeof DOCUMENT_EXTENSION_VALUES)[number] // Creates a union type of the array values, e.g. 'doc' | 'docx' | ...

export const DOCUMENT_EXTENSIONS: ReadonlySet<DocumentType> = new Set(DOCUMENT_EXTENSION_VALUES)

export function isDocumentFile(inputPath: string): boolean {
    /* Checks if the file extension indicates a document type that LibreOffice can handle. */
    const ext = inputPath.split('.').pop()?.toLowerCase() ?? ''
    if (!ext) return false
    return DOCUMENT_EXTENSIONS.has(ext as DocumentType)
}

export function isValidDocumentType(value: string): value is DocumentType {
    /* Type guard to check if a string is a valid LibreOffice DocumentType. */
    return DOCUMENT_EXTENSIONS.has(value as DocumentType)
}


function getCandidates(): string[] {
    switch (process.platform) {
        case 'linux':
            return [
                'libreoffice',         // in PATH (apt, dnf, pacman installs)
                'soffice',             // alternative name
                '/usr/bin/libreoffice',
                '/usr/bin/soffice',
                '/snap/bin/libreoffice', // snap install
                '/opt/libreoffice/program/soffice', // manual install
            ]
        case 'darwin':
            return [
                '/Applications/LibreOffice.app/Contents/MacOS/soffice',
                '/Applications/LibreOffice.app/Contents/MacOS/libreoffice',
                'libreoffice', // if symlinked into PATH via brew
                'soffice',
            ]
        case 'win32':
            return [
                'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
                'soffice.exe',
            ]
        default:
            return ['libreoffice', 'soffice']
    }
}

export function resolveLibreOfficePath(): string | null {
    /**
     * Resolves the LibreOffice binary path by trying each candidate.
     * Returns the first working path, or null if none found.
     */
    for (const candidate of getCandidates()) {
        try {
            // For absolute paths, check existence first
            if (candidate.startsWith('/') || candidate.includes('\\')) {
                if (!fs.existsSync(candidate)) continue
            }
            // Run --version to confirm it actually works
            execSync(`"${candidate}" --version`, { stdio: 'ignore', timeout: 5000 })
            //console.log(`LibreOffice found at: ${candidate}`)
            return candidate
        } catch {
            // Not found or not executable — try next
            continue
        }
    }
    // console.log('LibreOffice not found on this system')
    return null
}

// Module-scoped cache — detected once on startup
let cachedPath: string | null | undefined = undefined

export function getLibreOfficePath(): string | null {
    if (cachedPath === undefined) {
        cachedPath = resolveLibreOfficePath()
    }
    return cachedPath
}

export function isLibreOfficeAvailable(): boolean {
    return getLibreOfficePath() !== null
}

// Filter mapping 
// LibreOffice uses named filters for output formats.
// Full list: https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html
const WRITER_FILTERS: Record<string, string> = {
    pdf: 'writer_pdf_Export',
    docx: 'MS Word 2007 XML',
    odt: 'writer8',
    txt: 'Text',
    html: 'HTML (StarWriter)',
    rtf: 'Rich Text Format',
}

const CALC_FILTERS: Record<string, string> = {
    pdf: 'calc_pdf_Export',
    xlsx: 'Calc MS Excel 2007 XML',
    ods: 'calc8',
    csv: 'Text - txt - csv (StarCalc)',
    html: 'HTML (StarCalc)',
}

const IMPRESS_FILTERS: Record<string, string> = {
    pdf: 'impress_pdf_Export',
    pptx: 'Impress MS PowerPoint 2007 XML',
    odp: 'impress8',
}

// Input extension → filter map
function getFilterMap(inputExt: string): Record<string, string> {

    if (!isValidDocumentType(inputExt)) return WRITER_FILTERS // fallback to something rather than fail outright

    if (isLibreOfficeDocumentExt(inputExt)) return WRITER_FILTERS
    if (isLibreOfficeSpreadsheetExt(inputExt)) return CALC_FILTERS
    if (isLibreOfficePresentationExt(inputExt)) return IMPRESS_FILTERS

    return WRITER_FILTERS // fallback
}

function resolveLibreOfficeOutputPath(
    inputPath: string,
    outputExt: string,
    outputDir: string,
): string {
    const stem = path.basename(inputPath, path.extname(inputPath))
    const candidate = path.join(outputDir, `${stem}.${outputExt}`)

    if (!fs.existsSync(candidate)) return candidate

    let counter = 1
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const next = path.join(outputDir, `${stem} (${counter}).${outputExt}`)
        if (!fs.existsSync(next)) return next
        counter++
    }
}

export function runLibreOffice(
    inputPath: string,
    outputFormat: DocumentType,
    outputDir: string,
    win: BrowserWindow,
): Promise<string> {
    /**
     * Runs a LibreOffice headless conversion.
     * Emits log and done/error events to the renderer.
     */
    return new Promise((resolve, reject) => {
        const loBin = getLibreOfficePath()
        if (!loBin) {
            reject(new Error('LibreOffice not found'))
            return
        }

        const inputExt = path.extname(inputPath).replace('.', '').toLowerCase()
        const filterMap = getFilterMap(inputExt)
        const filter = filterMap[outputFormat.toLowerCase()]

        if (!filter) {
            reject(new Error(`No LibreOffice filter for ${inputExt} → ${outputFormat}`))
            return
        }

        const emit = (message: string, level = 'default') =>
            win.webContents.send('conversion-log', {
                time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                message,
                level,
            })

        emit(`LIBREOFFICE: ${path.basename(inputPath)} → ${outputFormat.toUpperCase()}`, 'info')
        emit(`FILTER: ${filter}`, 'default')
        emit(`OUTPUT_DIR: ${outputDir}`, 'default')

        // LibreOffice args:
        // --headless          no GUI
        // --convert-to <fmt>  output format (can include filter: "pdf:writer_pdf_Export")
        // --outdir <dir>      where to place the output file
        const args = [
            '--headless',
            '--convert-to', `${outputFormat}:${filter}`,
            '--outdir', outputDir,
            inputPath,
        ]

        //console.log(`Running: "${loBin}" ${args.join(' ')}`)

        const child = spawn(loBin, args)
        let stderr = ''
        let stdout = ''

        child.stdout.on('data', (data: Buffer) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data: Buffer) => {
            stderr += data.toString()
        })

        child.on('close', (code) => {
            if (code !== 0) {
                const msg = `LibreOffice exited with code ${code}: ${stderr.trim()}`
                emit(`ERROR: ${msg}`, 'error')
                reject(new Error(msg))
                return
            }

            // LibreOffice prints: "convert /path/input.docx -> /path/output.pdf using filter ..."
            emit(`OUTPUT: ${stdout.trim()}`, 'default')

            // Determine actual output path LibreOffice created
            const stem = path.basename(inputPath, path.extname(inputPath))
            const loOutputPath = path.join(outputDir, `${stem}.${outputFormat}`)

            if (!fs.existsSync(loOutputPath)) {
                const msg = `Expected output not found: ${loOutputPath}`
                emit(`ERROR: ${msg}`, 'error')
                reject(new Error(msg))
                return
            }

            // Rename if there would be a conflict with an existing file
            const finalPath = resolveLibreOfficeOutputPath(inputPath, outputFormat, outputDir)

            if (finalPath !== loOutputPath) {
                fs.renameSync(loOutputPath, finalPath)
            }

            emit(`CONVERSION_COMPLETE → ${path.basename(finalPath)}`, 'success')
            resolve(finalPath)
        })

        child.on('error', (err) => {
            emit(`SPAWN_ERROR: ${err.message}`, 'error')
            reject(err)
        })
    })
}