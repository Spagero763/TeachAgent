"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function AgentCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 6)

    // Main shape — subtle, dark
    const geo = new THREE.IcosahedronGeometry(1.6, 1)
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0d0d1a"),
      emissive: new THREE.Color("#3730a3"),
      emissiveIntensity: 0.2,
      metalness: 0.95,
      roughness: 0.05,
    })
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    // Wire overlay — very subtle
    const wireMat = new THREE.MeshBasicMaterial({
      color: "#4f46e5",
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    const wire = new THREE.Mesh(geo, wireMat)
    wire.scale.setScalar(1.01)
    scene.add(wire)

    // Second ring shape
    const ring = new THREE.TorusGeometry(2.4, 0.008, 8, 80)
    const ringMat = new THREE.MeshBasicMaterial({
      color: "#818cf8",
      transparent: true,
      opacity: 0.12,
    })
    scene.add(new THREE.Mesh(ring, ringMat))

    const ring2 = new THREE.TorusGeometry(2.8, 0.005, 8, 80)
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: "#c7d2fe",
      transparent: true,
      opacity: 0.06,
    })
    const ring2Mesh = new THREE.Mesh(ring2, ring2Mat)
    ring2Mesh.rotation.x = Math.PI / 3
    scene.add(ring2Mesh)

    // Particles — very sparse
    const pCount = 80
    const pPos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      const r = 3.5 + Math.random() * 4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pPos[i * 3 + 2] = r * Math.cos(phi)
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({ color: "#a5b4fc", size: 0.018, transparent: true, opacity: 0.5 })
    scene.add(new THREE.Points(pGeo, pMat))

    // Lighting
    scene.add(new THREE.AmbientLight("#ffffff", 0.1))
    const l1 = new THREE.PointLight("#4f46e5", 4, 12)
    l1.position.set(4, 4, 4)
    scene.add(l1)
    const l2 = new THREE.PointLight("#818cf8", 2, 10)
    l2.position.set(-4, -3, -4)
    scene.add(l2)

    let mx = 0, my = 0
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 1.5
      my = -(e.clientY / window.innerHeight - 0.5) * 1.5
    }
    window.addEventListener("mousemove", onMouse)

    const clock = new THREE.Clock()
    let af: number
    function animate() {
      af = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      mesh.rotation.x = t * 0.08 + my * 0.2
      mesh.rotation.y = t * 0.12 + mx * 0.2
      wire.rotation.copy(mesh.rotation)
      ring2Mesh.rotation.z = t * 0.04
      ;(mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.18 + Math.sin(t * 0.8) * 0.08
      l1.position.x = Math.sin(t * 0.5) * 4
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(af)
      window.removeEventListener("mousemove", onMouse)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
}